'use strict';

/* Controllers */

var phonecatControllers = angular.module('phonecatControllers', ['ui.bootstrap','ngSanitize']);

phonecatControllers.controller('PhoneListCtrl', ['$scope', 'Phone',
  function($scope, Phone) {

    $scope.phones = Phone.query(function(){
      $scope.orderFunc = function(d){return 0-new Date(d.date).valueOf();};
      $scope.currentPage = 1;
//      $scope.numPages = Math.ceil($scope.phones.length / 10); 
      $scope.selectedGenres = '';   
    });

    $scope.orderProp = 'date';

    if(localStorage['jrecin-genres']){
      $scope.genres = JSON.parse(localStorage['jrecin-genres']);
    }else{
    $scope.genres = [
      {id: 'humanint',name: '総合人文社会', selected: true},
      {id: 'human',name: '人文学', selected: true},
      {id: 'soc',name: '社会科学', selected: true},
      {id: 'sciint',name: '総合理工', selected: true},
      {id: 'math',name: '数物系科学', selected: true},
      {id: 'chem',name: '化学', selected: true},
      {id: 'eng',name: '工学', selected: true},
      {id: 'bioint',name: '総合生物', selected: true},
      {id: 'bio',name: '生物学', selected: true},
      {id: 'agri',name: '農学', selected: true},
      {id: 'med',name: '医歯薬学', selected: true},
      {id: 'info',name: '情報学', selected: true},
      {id: 'env',name: '環境学', selected: true},
      {id: 'int',name: '複合領域', selected: true},
      {id: 'other',name: 'その他', selected: true}
    ];      
    }

    if(localStorage['jrecin-titles']){
      $scope.titles = JSON.parse(localStorage['jrecin-titles']);
    }else{

    $scope.titles = [
      {id: 'head',name: '機関の長相当', selected: true},
      {id: 'prof',name: '教授相当', selected: true},
      {id: 'assoc',name: '准教授・常勤専任講師相当', selected: true},
      {id: 'assis',name: '助教相当', selected: true},
      {id: 'postdoc',name: '研究員・ポスドク相当', selected: true},
      {id: 'adjunct',name: '非常勤講師相当', selected: true},
      {id: 'technician',name: '研究・教育補助者相当', selected: true},
      {id: 'admin',name: '研究管理者相当', selected: true},
      {id: 'dev',name: '研究開発・技術者相当', selected: true},
      {id: 'teacher',name: '専門学校・小中高等の教員相当', selected: true},
      {id: 'commun',name: 'コミュニケーター相当', selected: true}
      ,{id: 'other',name: 'その他', selected: true}
    ];
  }

      if(localStorage['jrecin-alltoggles']){
        var a = JSON.parse(localStorage['jrecin-alltoggles']);
        console.log(a);
        $scope.allgenres = a.genres;
        $scope.alltitles = a.titles;
      }else{
        $scope.allgenres = true;
        $scope.alltitles = true;
      }


    $scope.selectGenre = function(o,idx){
      var g = o.genre;
      if(!g)return false;
      for(var i = 0; i < o.genre.length; i++){
        var gg = _.findWhere($scope.genres,{name: o.genre[i]});
        if(gg && gg.selected) return true;
      }
      return false;
    };

    var notOtherTitles = _.difference(_.map($scope.titles,function(t){return t.name;}),['その他']);

    $scope.selectTitle = function(o,idx){
      var t = o.title;
      if(!t)return false;
      if(_.findWhere($scope.titles,{id: 'other'}).selected){
        var flag = true;
        for(var i = 0; i < t.length; i++){
          if(notOtherTitles.indexOf(t[i])!=-1) flag = false;
        }
        if(flag){
          return true;
        }
      }
      for(var i = 0; i < t.length; i++){
        var gg = _.findWhere($scope.titles,{name: t[i]});
        if(gg && gg.selected) return true;
      }
      return false;
    };

    $scope.ceil = function(v){return Math.ceil(v);};

    $scope.remaining = function(phone){
      return Math.ceil((new Date(phone.period[1]) - new Date())/(1000*60*60*24));
    };

    $scope.nextPage = function(){
      $scope.currentPage += 1;
    }
    $scope.prevPage = function(){
      var p = $scope.currentPage - 1;
      $scope.currentPage = _.max([1,p]);
    }


    $scope.allgenresToggle = function(){
      localStorage['jrecin-alltoggles'] = JSON.stringify({genres: !$scope.allgenres, titles: $scope.alltitles});
      _.map($scope.genres,function(g){
        g.selected = !$scope.allgenres;
      });
    };


    $scope.alltitlesToggle = function(){
      localStorage['jrecin-alltoggles'] = JSON.stringify({titles: !$scope.alltitles, genres: $scope.allgenres});
      _.map($scope.titles,function(g){
        g.selected = !$scope.alltitles;
      });
    };

    $scope.showDetail = function(el){
      var id = el.phone.id;
      if($scope.showing == id){
        $scope.showing = undefined;
      }else{
        $scope.showing = id;        
      }
    };

    $scope.formatDate = function(d){
      return d == 'NA' ? '（不明）' : (d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + (d.getDate()+1) + '日');
    };

    $scope.$watch('orderProp',function(d){
      console.log(d);

      var list = {
        period: function(d){return d.period[1].valueOf();}
        , period_rev: function(d){return 0-d.period[1].valueOf();}
        , date: function(d){return 0-new Date(d.date).valueOf();}
        , date_rev: function(d){return new Date(d.date).valueOf();}
      };

      console.log(list[d]);

      $scope.orderFunc = list[d];
    },true);

    $scope.$watch('genres',function(newval,oldval){
      localStorage['jrecin-genres'] = JSON.stringify(newval);
      $scope.currentPage = 1;
    },true);

    $scope.$watch('titles',function(newval,oldval){
      localStorage['jrecin-titles'] = JSON.stringify(newval);
      $scope.currentPage = 1;
    },true);

  }]);

phonecatControllers.controller('PhoneDetailCtrl', ['$scope', '$routeParams', 'Phone', '$sce',
  function($scope, $routeParams, Phone,$sce) {
    $scope.phone = Phone.get({phoneId: $routeParams.phoneId}, function(phone) {
//      $scope.mainImageUrl = phone.images[0];
      console.log($scope.phone);
      $scope.description = $sce.trustAsHtml($scope.phone.data['求人内容']);
      $scope.qualification = $sce.trustAsHtml($scope.phone.data['応募資格']);
    });

    $scope.duedate = function(s){
      console.log(s);
      var d = (s && s!='NA') ? new Date(s.split(':')[1]) : undefined;

      return (d == 'NA' || !d)? '（不明）' : (d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + (d.getDate()+1) + '日');
    };
  

    $scope.setImage = function(imageUrl) {
      $scope.mainImageUrl = imageUrl;
    }
  }]);

phonecatControllers.controller('PhonePreviewCtrl', ['$scope', '$routeParams', 'Phone', '$sce',
  function($scope, $routeParams, Phone,$sce) {
    $scope.phone = Phone.get({phoneId: $scope.showing}, function(phone) {
//      $scope.mainImageUrl = phone.images[0];
      console.log($scope.phone);
      $scope.phone.qualification = strip($scope.phone.data['応募資格']) || '（見つかりません）';
      $scope.phone.description = strip($scope.phone.data['求人内容']) || '（見つかりません）';
      $scope.phone.process = strip($scope.phone.data['応募・選考・結果通知・連絡先']) || '（見つかりません）';
    });

    $scope.test = 'Hello';

  }]);


function strip(html)
{
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}
