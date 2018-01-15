import Mustache from 'mustache';
import { find } from 'underscore';
import template from './visualization-embed.html';
import logoUrl from '../../assets/images/redash_icon_small.png';
import { Parameters } from '../../services/query';
import { default as XlsxGenerator } from '../../utils/data2xlsx';

const VisualizationEmbed = {
  template,
  bindings: {
    data: '<',
  },
  controller($routeParams, Query, QueryResult) {
    'ngInject';

    document.querySelector('body').classList.add('headless');
    const visualizationId = parseInt($routeParams.visualizationId, 10);
    this.showQueryDescription = $routeParams.showDescription;
    this.apiKey = $routeParams.api_key;
    this.logoUrl = logoUrl;
    this.query = new Query(this.data[0]);
    this.queryResult = new QueryResult(this.data[1]);
    this.visualization =
      find(this.query.visualizations, visualization => visualization.id === visualizationId);
    this.downloadData = (fileType) => {
      const generator = new XlsxGenerator(this.queryResult);
      generator.downloadXlsx(this.queryResult.getName(this.query.name, fileType));
    };
  },
};

export default function (ngModule) {
  ngModule.component('visualizationEmbed', VisualizationEmbed);

  function session($http, $route, Auth) {
    'ngInject';

    const apiKey = $route.current.params.api_key;
    Auth.setApiKey(apiKey);
    return Auth.loadConfig();
  }

  function retrieveJob($http, apiKey, jobInfo) {
    if (jobInfo.status < 3) {
      // wait for result
      return $http.get(`api/jobs/${jobInfo.id}?api_key=${apiKey}`).then((response) => {
        if (response.data.job === null) {
          response.job = 1;
        }
        return retrieveJob($http, apiKey, response.data.job);
      });
    }
    if (jobInfo.status === 3) {
      // $http.header('Accept-Encoding', 'gzip');
      return $http.get(`api/query_results/${jobInfo.query_result_id}?api_key=${apiKey}`).then((response) => {
        if (response.data === null) {
          response.data = 0;
        }
        return response.data;
      });
    }
    return [];
  }

  function loadData($http, $route, $q, Auth) {
    return session($http, $route, Auth).then(() => {
      const queryId = $route.current.params.queryId;
      return $http.get(`api/queries/${queryId}`).then((response) => {
        const queryRes = response.data;
        const sqlParams = new Parameters(queryRes, $route.current.params);
        const apiKey = $route.current.params.api_key;
        const queryText = Mustache.render(queryRes.query, sqlParams.getValues());
        const params = {
          data_source_id: queryRes.data_source_id,
          query: queryText,
          max_age: 0,
          query_id: queryId,
        };
        const queryResult = $http.post(`api/query_results?api_key=${apiKey}`, params).then((rsp) => {
          if (rsp.data.job === null) {
            rsp.job = { id: 1 };
          }
          return retrieveJob($http, apiKey, rsp.data.job);
        });
        return $q.all([queryRes, queryResult]);
      });
    });
  }

  ngModule.config(($routeProvider) => {
    $routeProvider.when('/embed/query/:queryId/visualization/:visualizationId', {
      template: '<visualization-embed data="$resolve.data"></visualization-embed>',
      resolve: {
        data: loadData,
      },
    });
  });
}
