'use strict';

/* Controllers */

var phonecatControllers = angular.module('phonecatControllers', ['ui.bootstrap','ngSanitize']);

function formatDate(d){
  return (!d || d == 'NA') ? '（不明）' : (d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + (d.getDate()+1) + '日');
}

function collectKeys(arr,typ){
  console.log(arr[0]);

  var res = null;
  if(typ=='genre'){
        var a = _.chain(arr).map(function(d){return d.genre;}).flatten().compact().countBy(function(d){return d;}).value();
    var b = _.chain(a).pairs().sortBy(function(v){return 0-v[1];}).map(function(v){return v[0]}).value();
    res = [b];
  }else if(typ=='title'){
    var a = _.chain(arr).map(function(d){return d.title;}).flatten().compact().countBy(function(d){return d;}).value();
    var b = _.chain(a).pairs().sortBy(function(v){return 0-v[1];}).map(function(v){return v[0]}).value();
    res = [b];
  }else if(typ=='place'){
    var a = _.chain(arr).map(function(d){return d.place;}).flatten().compact().countBy(function(d){return d;}).value();
    var b = _.chain(a).pairs().sortBy(function(v){return 0-v[1];}).map(function(v){return v[0]}).value();
    res = [b];
  }else if(typ=='institution'){
    var a = _.chain(arr).map(function(d){return d[typ];}).compact().countBy(function(d){return d;}).value();
    var b = _.chain(a).pairs().sortBy(function(v){return 0-v[1];}).map(function(v){return v[0]}).value();
    res = [b.length > 50 ? b.slice(0,50).concat(['（以下省略）']) : b, b.length > 50 ? '以下省略' : undefined];
  }else if(typ=='datestr'){
    var a = _.chain(arr).filter(function(d){return d.date;}).compact()
      .uniq(function(d){return d.datestr;}).sortBy(function(d){return 0-d.date.valueOf();})
    .map(function(d){return d.datestr;}).value();
    res = [a.length > 50 ? a.slice(0,50).concat(['（以下省略）']) : a, a.length > 50 ? '以下省略' : undefined];
  }else if(typ=='deadlinestr'){
    var a = _.chain(arr).filter(function(d){return d.deadlinestr;}).compact()
      .uniq(function(d){return d.deadlinestr;}).sortBy(function(d){return d.period[1].valueOf();})
    .map(function(d){return d.deadlinestr;}).value();
    res = [a.length > 50 ? a.slice(0,50).concat(['（以下省略）']) : a, a.length > 50 ? '以下省略' : undefined];
  }else{
    var a = _.chain(arr).map(function(d){return d[typ];}).compact().countBy(function(d){return d;}).value();
    var b = _.chain(a).pairs().sortBy(function(v){return 0-v[1];}).map(function(v){return v[0]}).value();
    res = [b];
  }
  return res;
}

phonecatControllers.controller('PhoneGridCtrl', ['$scope', 'Phone',
  function($scope, Phone) {
    $scope.resetAllSettings = function(){
      localStorage.removeItem('jrecin-genres');
      localStorage.removeItem('jrecin-titles');
      localStorage.removeItem('jrecin-alltoggles');
      localStorage.removeItem('jrecin-grid-condition');
      localStorage.removeItem('jrecin-search-mode');
      location.reload();
    }

        $scope.yaxis = 'title';
    $scope.xaxis = 'genre';
    $scope.zaxis = 'place';
    $scope.keysCache = {};
    $scope.phones = Phone.query(function(){
      $scope.orderFunc = function(d){return 0-new Date(d.date).valueOf();};
      $scope.currentPage = 1;
//      $scope.numPages = Math.ceil($scope.phones.length / 10); 
      $scope.selectedGenres = '';
      $scope.xkeys = collectKeys($scope.phones,$scope.xaxis,$scope)[0];
      $scope.ykeys = collectKeys($scope.phones,$scope.yaxis,$scope)[0];
      $scope.keysCache[$scope.xaxis] = $scope.xkeys;
      $scope.keysCache[$scope.yaxis] = $scope.ykeys;
      $scope.recalcStat();
    });

        $scope.loadGridCondition = function(){
      var json = localStorage['jrecin-grid-condition'];
      if(json){
        var o = JSON.parse(json);
        console.log(o);
        $scope.xaxis = o.xaxis;
        $scope.yaxis = o.yaxis;
        $scope.selected = {};
        _.map(o.selected,function(s){
          if(!$scope.selected[s.x]){
            $scope.selected[s.x] = {};
          }
          $scope.selected[s.x][s.y] = true;
        });
      }else{
        $scope.selected = {};
      }
    };
      $scope.loadGridCondition();
      console.log($scope.selected);

    $scope.content = function(kx,ky){
      var x = $scope.stat[kx];
      return x ? x[ky] : undefined;
    };

    $scope.recalcStat = function(){
      $scope.stat = {};

      var v = _.groupBy($scope.phones,function(phone){
        return phone[$scope.xaxis];
      });
      console.log(v);
      _.map($scope.phones,function(phone){
        var kxs = phone[$scope.xaxis];
        var kys = phone[$scope.yaxis];
        if($scope.xaxis == 'date'){
          kxs = formatDate(kxs);
        }
        if($scope.yaxis == 'date'){
          kys = formatDate(kys);          
        }
        if(!(kxs instanceof Array)) kxs = [kxs];
        if(!(kys instanceof Array)) kys = [kys];

        _.map(kxs,function(kx){
          _.map(kys,function(ky){
            if(!$scope.stat[kx]){
              $scope.stat[kx] = {};
            }
            if(!$scope.selected[kx]){
              $scope.selected[kx] = {};
            }
            if($scope.stat[kx][ky]){
              $scope.stat[kx][ky] += 1;
            }else{
              $scope.stat[kx][ky] = 1
            }
            if(!$scope.selected[kx][ky]){
              $scope.selected[kx][ky] = false;
            }
          });
        });
      });
    };

    $scope.goList = function(){
      localStorage['jrecin-search-mode']='grid';
      location.href = '#/jobs';
    }

    $scope.cellSelected = function(kx,ky){
      return $scope.selected[kx][ky];
    };

    $scope.toggleSelected = function(kx,ky){
      $scope.selected[kx][ky] = !$scope.selected[kx][ky];
      saveGridCondition();
    };



    function saveGridCondition(){
      var obj = {xaxis: $scope.xaxis, yaxis: $scope.yaxis, selected: []};
      _.map($scope.xkeys,function(kx,x){
        _.map($scope.ykeys,function(ky,y){
          if($scope.selected[kx][ky]){
            obj.selected.push({x: kx, y: ky});
          }
        });
      });
      localStorage['jrecin-grid-condition'] = JSON.stringify(obj);
    }

    $scope.switchAxes = function(){
      var temp = $scope.xaxis;
      $scope.xaxis = $scope.yaxis;
      $scope.yaxis = temp;
    };

    $scope.$watch('xaxis',function(nv){
      if($scope.keysCache[nv]){
        console.log('Using cache for x keys...');
        $scope.xkeys = $scope.keysCache[nv];        
      }else{
        $scope.xkeys = collectKeys($scope.phones,$scope.xaxis,$scope)[0];        
      }
      saveGridCondition();
      $scope.recalcStat();
    });
    $scope.$watch('yaxis',function(nv){
      if($scope.keysCache[nv]){
        console.log('Using cache for y keys...');
        $scope.ykeys = $scope.keysCache[nv];        
      }else{
        $scope.ykeys = collectKeys($scope.phones,$scope.yaxis,$scope)[0];        
      }
      saveGridCondition();
      $scope.recalcStat();
    });
    $scope.$watch('zaxis',function(nv){
      $scope.zkeys = collectKeys($scope.phones,$scope.zaxis,$scope)[0];
      $scope.recalcStat();
    });
  }]);

phonecatControllers.controller('PhoneListCtrl', ['$scope', 'Phone',
  function($scope, Phone) {

    $scope.resetAllSettings = function(){
      localStorage.removeItem('jrecin-genres');
      localStorage.removeItem('jrecin-titles');
      localStorage.removeItem('jrecin-alltoggles');
      localStorage.removeItem('jrecin-grid-condition');
      localStorage.removeItem('jrecin-search-mode');
      location.reload();
    }

    $scope.phones = Phone.query(function(){
      $scope.currentPage = 1;
//      $scope.numPages = Math.ceil($scope.phones.length / 10); 
      $scope.selectedGenres = '';   
    });

    $scope.axisName = {title: '職種', genre: '分野', place: '都道府県', institution: '機関',
      datestr: '更新日', deadlinestr: '締切'
    };

    function showCondition(json){
      if(!json || json.selected.length == 0){
        return '何も選択されていません';
      }
      console.log(json);
      var x = $scope.axisName[json.xaxis] || json.xaxis;
      var y = $scope.axisName[json.yaxis] || json.yaxis;
      var s = '('+x+', '+y+') = '
      s += _.map(json.selected,function(c){
        return '('+c.x+', '+c.y+')'
      }).join(' or ');
      return s;
    }

    if(localStorage['jrecin-search-mode']=='grid'){
      $scope.gridMode = true;
      $scope.normalSearchMode = false;      
    }else if(localStorage['jrecin-search-mode']=='genretitle'){
      $scope.gridMode = false;
      $scope.normalSearchMode = true;      
    }else{
      $scope.gridMode = false;
      $scope.normalSearchMode = true;
      localStorage['jrecin-search-mode']='genretitle';
    }
    $scope.gridCondition = localStorage['jrecin-grid-condition'] ? JSON.parse(localStorage['jrecin-grid-condition']) : undefined;
    $scope.conditionStr = showCondition($scope.gridCondition);

    $scope.$watch('gridMode',function(){
//      console.log('gridMode',$scope.gridMode);
      localStorage['jrecin-search-mode']= $scope.gridMode ? 'grid' : 'genretitle';
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

    $scope.filterRecord = function(o,idx){
      if($scope.gridMode){
        if(!$scope.gridCondition) return false;
//        console.log('grid');

        var x = $scope.gridCondition.xaxis;
        var y = $scope.gridCondition.yaxis;

        var ox = o[x] instanceof Array ? o[x] : [o[x]];
        var oy = o[y] instanceof Array ? o[y] : [o[y]];

        var sels = $scope.gridCondition.selected;

        var flag = false;
        for(var i=0;i<sels.length;i++){
          if(ox.indexOf(sels[i].x)!=-1 && oy.indexOf(sels[i].y)!=-1){
            flag = true;
            break;
          }
        }
        return flag;
    }else{
        var g = o.genre;
        if(!g)return false;
        var flag = false;
        for(var i = 0; i < o.genre.length; i++){
          var gg = _.findWhere($scope.genres,{name: o.genre[i]});
          if(gg && gg.selected){
            flag = true;
            break;
          }
        }
        if(!flag) return false;

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
      }

    };


    var notOtherTitles = _.difference(_.map($scope.titles,function(t){return t.name;}),['その他']);

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

    $scope.hiddenTitleGenre = true;
    $scope.hiddenTitle = false;
    $scope.hiddenGenre = false;

    $scope.toggleTitleGenre = function(){
      $scope.hiddenTitleGenre = !$scope.hiddenTitleGenre;
    };

    $scope.toggleGenre = function(){
      $scope.hiddenGenre = !$scope.hiddenGenre;
    };
    $scope.toggleTitle = function(){
      $scope.hiddenTitle = !$scope.hiddenTitle;
    };

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
        return formatDate(d);
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
