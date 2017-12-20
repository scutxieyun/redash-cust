import XLSX from 'xlsx';
import FileSaver from 'file-saver';
import template from './widget.html';
import editTextBoxTemplate from './edit-text-box.html';

const EditTextBoxComponent = {
  template: editTextBoxTemplate,
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&',
  },
  controller(toastr) {
    'ngInject';

    this.saveInProgress = false;
    this.widget = this.resolve.widget;
    this.saveWidget = () => {
      this.saveInProgress = true;
      this.widget.$save().then(() => {
        this.close();
      }).catch(() => {
        toastr.error('Widget can not be updated');
      }).finally(() => {
        this.saveInProgress = false;
      });
    };
  },
};

function DashboardWidgetCtrl($location, $uibModal, $window, Events, currentUser) {
  this.canViewQuery = currentUser.hasPermission('view_query');

  this.editTextBox = () => {
    $uibModal.open({
      component: 'editTextBox',
      resolve: {
        widget: this.widget,
      },
    });
  };

  this.localParametersDefs = () => {
    if (!this.localParameters) {
      this.localParameters = this.widget.query.getParametersDefs().filter(p => !p.global);
    }
    return this.localParameters;
  };

  this.deleteWidget = () => {
    if (!$window.confirm(`Are you sure you want to remove "${this.widget.getName()}" from the dashboard?`)) {
      return;
    }

    Events.record('delete', 'widget', this.widget.id);

    this.widget.$delete((response) => {
      this.dashboard.widgets =
        this.dashboard.widgets.map(row => row.filter(widget => widget.id !== undefined));

      this.dashboard.widgets = this.dashboard.widgets.filter(row => row.length > 0);

      this.dashboard.layout = response.layout;
      this.dashboard.version = response.version;

      if (this.deleted) {
        this.deleted({});
      }
    });
  };
  this.downloadWidget = (fileType) => {
    if (this.queryResult && this.queryResult.getData() !== null) {
      const rows = this.queryResult.getData();
      const columns = this.queryResult.getColumns();
      const data = [];
      rows.forEach((row) => {
        const jsonObj = [];
        columns.forEach((col) => {
          jsonObj[col.title] = row[col.name];
        });
        data.push(jsonObj);
      });
      const wb = { SheetNames: ['Sheet1'], Sheets: {}, Props: {} };
      wb.Sheets.Sheet1 = XLSX.utils.json_to_sheet(data);
      const wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' });
      FileSaver.saveAs(new Blob([this.s2ab(wbout)], { type: 'application/octet-stream' }), this.queryResult.getName(this.query.name, fileType));
    }
  };
  this.s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i !== s.length; i += 1) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  };

  Events.record('view', 'widget', this.widget.id);

  this.reload = (force) => {
    let maxAge = $location.search().maxAge;
    if (force) {
      maxAge = 0;
    }
    this.queryResult = this.query.getQueryResult(maxAge);
  };

  if (this.widget.visualization) {
    Events.record('view', 'query', this.widget.visualization.query.id, { dashboard: true });
    Events.record('view', 'visualization', this.widget.visualization.id, { dashboard: true });

    this.query = this.widget.getQuery();
    this.reload(false);

    this.type = 'visualization';
  } else if (this.widget.restricted) {
    this.type = 'restricted';
  } else {
    this.type = 'textbox';
  }
}

export default function (ngModule) {
  ngModule.component('editTextBox', EditTextBoxComponent);
  ngModule.component('dashboardWidget', {
    template,
    controller: DashboardWidgetCtrl,
    bindings: {
      widget: '<',
      public: '<',
      dashboard: '<',
      deleted: '&onDelete',
    },
  });
}
