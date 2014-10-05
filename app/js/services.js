'use strict';

/* Services */

var phonecatServices = angular.module('phonecatServices', ['ngResource']);


phonecatServices.factory('Phone', ['$resource',
  function($resource){
	var data_id = '20141004_1';
    return $resource('data/'+data_id+'/:phoneId.json', {}, {
      query: {method:'GET', params:{phoneId:'list'}, isArray:true,
      			transformResponse: function(str){
      			 var json = angular.fromJson(str);
      			 return _.map(json,function(d){
//      			 	d.place = d.place ? _.map(d.place.split(','),function(s){return s.split('-')[0];}).join(', ') : undefined;
//					d.place = d.place ? d.place.split('-,')[1] : undefined;
					d.place = d.place ?
								_.map(d.place.replace(/ -,/g,":").split(','),function(s){return s.split(':')[1]}).join(', ')
								: undefined;
					d.genre = d.genre ? _.uniq(d.genre.split(':')) : undefined;
					d.title = d.title ? _.uniq(d.title.split(':')) : undefined;
					d.period = d.period ? d.period.split(':') : undefined;
//					console.log(Object.keys(d.data || {}));
      			 	return d;
      			 });
      			}
  	}
    });
  }]);
