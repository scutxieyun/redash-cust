import moment from 'moment';

import { LivePaginator } from '../../utils';
import template from './queries-list.html';

class QueriesListCtrl {
  constructor($location, Title, Query) {
    const page = parseInt($location.search().page || 1, 10);

    this.defaultOptions = {};

    const self = this;

    switch ($location.path()) {
      case '/queries':
        Title.set('查询列表');
        this.resource = Query.query;
        break;
      case '/queries/my':
        Title.set('我的查询');
        this.resource = Query.myQueries;
        break;
      default:
        break;
    }

    function queriesFetcher(requestedPage, itemsPerPage, paginator) {
      $location.search('page', requestedPage);

      const request = Object.assign({}, self.defaultOptions,
        { page: requestedPage, page_size: itemsPerPage });

      return self.resource(request).$promise.then((data) => {
        const rows = data.results.map((query) => {
          query.created_at = moment(query.created_at);
          query.retrieved_at = moment(query.retrieved_at);
          return query;
        });

        paginator.updateRows(rows, data.count);
      });
    }

    this.paginator = new LivePaginator(queriesFetcher, { page });

    this.tabs = [
      { name: '我的查询', path: 'queries/my' },
      { path: 'queries', name: '所有查询', isActive: path => path === '/queries' },
    ];
  }
}

export default function (ngModule) {
  ngModule.component('pageQueriesList', {
    template,
    controller: QueriesListCtrl,
  });

  const route = {
    template: '<page-queries-list></page-queries-list>',
    reloadOnSearch: false,
  };

  return {
    '/queries': route,
    '/queries/my': route,
  };
}
