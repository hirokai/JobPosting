'use strict';

/* Services */

var phonecatServices = angular.module('phonecatServices', ['ngResource']);


function formatDate(d){
  return (!d || d == 'NA') ? '（不明）' : (d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + (d.getDate()+1) + '日');
}

phonecatServices.factory('Phone', ['$resource',
  function($resource){
	var data_id = '20141005_01';
    return $resource('data/'+data_id+'/:phoneId.json', {}, {
      query: {method:'GET', params:{phoneId:'list'}, isArray:true,
      			transformResponse: function(str){
      			 var json = angular.fromJson(str);
      			 return _.compact(_.map(json,function(d){

              if(!d.subject) return null;
//      			 	d.place = d.place ? _.map(d.place.split(','),function(s){return s.split('-')[0];}).join(', ') : undefined;
//					d.place = d.place ? d.place.split('-,')[1] : undefined;
					d.place = d.place ?
								_.map(d.place.replace(/ -,/g,":").split(/[\s,]/),function(s){return s.split(':')[1]})
								: undefined;
					d.genre = d.genre ? _.uniq(d.genre.split(':')) : undefined;
					d.title = d.title ? _.uniq(d.title.split(':')) : undefined;
				  if(d.period){
            d.period = d.period.split(':');
            if(d.period[0]!= 'NA')d.period[0] = new Date(d.period[0]);
            if(d.period[1]!= 'NA')d.period[1] = new Date(d.period[1]);
          }
          d.date = d.date ? new Date(d.date) : undefined;
          d.datestr = d.date ? formatDate(d.date) : undefined;
          d.deadlinestr = d.period[1] ? formatDate(d.period[1]) : undefined;
//					console.log(Object.keys(d.data || {}));
      			 	return d;
      			 }));
      		}
  	}
    });
  }]);
