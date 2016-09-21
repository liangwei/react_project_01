(function (window, $) {
   var mapHouse = {
        searchInput: $('.map_input'),
        shUrl: 'http://' + curcityEn + '.esf.sina.com.cn/di/search/',
        searchDownList: '<%$.each(data,function(i,data){%>' +
        '<%if(data.type =="district"){%>' +
        '<li itemType="district"><a href="javascript:void(0)" class="_district clearfix"><em><%:=data.highlight%></em><span>在售<i><%:=data.salecount%></i>套</span></a></li>' +
        '<%}else if (data.type == "block"){%>' +
        '<li itemType="block"><a href="javascript:void(0)" class="_block clearfix"><em><%:=data.highlight%></em><span>在售<i><%:=data.salecount%></i>套</span></a></li>' +
        '<%}else if (data.type == "home"){%>' +
        '<li itemType="community"><a href="javascript:void(0)" class="_community clearfix"><em><%:=data.highlight%></em><span>在售<i><%:=data.salecount%></i>套</span></a></li>' +
        '<%}%>' +
        '<%});%>',
        zoom: 12,
        posPoint: '',
        isLoadHistory: false,
        currentCommunitySinaId: '',
        isMatchKeyword: false,
        districtOverLayerID: '',
        blockOverLayerID: '',
        searchKeyWord: '',
        isWhenZommGetData: true,
        household: window.inNeed.room ? window.inNeed.room : '', //筛选的户型
        pptype: window.inNeed.pptype ? window.inNeed.pptype : 'i1', //类型
        transientUpdateParam: null,//点击地图时的瞬间参数
        initFn: function () {
            mapHouse.slideIn();//搜索模块滑进滑出
            mapHouse.stopTouchMove();
            mapHouse.releaseTouchMove();
            mapHouse.mapscreen();//地图的筛选
            mapHouse.closeScreen();//关闭筛选
            mapHouse.goToListPage();//跳转列表页
            mapHouse.resultScreen();//结果列表筛选
            mapHouse.initSH();//联想搜索初始化
            mapHouse.searchFn();//精确搜索
            mapHouse.resultClickFn();//模糊搜索
            mapHouse.recommendClickFn();//推荐小区搜索
            mapHouse.closeResultListFn();//地图点击关闭小区列表展示
            mapHouse.clearHistoryFn();//清空历史记录
            $('.recommended_cell').on('click', function (e) {
                e.stopPropagation();
            });
            mapHouse.myPos();
            if (typeof localStorage.getItem == 'function' && localStorage.getItem('isChangeCity') == '1') {
                var t = setTimeout(function () {
                    $('#my_pos').get(0).click();
                    localStorage.setItem('isChangeCity', '0');
                    clearTimeout(t);
                    t = null;
                }, 300);
            }
        }
        ,
        bodyScroll: function (e) { //阻止touchmove
            e.preventDefault();
        }
        ,
        stopTouchMove: function () {
            document.addEventListener('touchmove', mapHouse.bodyScroll, false);
        }
        ,
        releaseTouchMove: function () {
            document.removeEventListener('touchmove', mapHouse.bodyScroll, false);
        }
        ,
        readHistory: function () {
            if (typeof localStorage.getItem == 'function') {
                var localData = localStorage.getItem('mapHouseSearchKeyword');
                var formaterHistoryData = localData ? mapHouse.deleteArrRepeat(localData.split(',')) : '';
                var hisHtml = '';
                for (var i = formaterHistoryData.length - 1; i >= 0; i--) {
                    hisHtml += '<li><a href="javascript:void(0);"><em>' + formaterHistoryData[i] + '</em></li>';
                }
                $('.search_result_list').html(hisHtml);
                if (localData) {
                    $('.history_list').show();
                } else {
                    $('.history_list').hide();
                }
            }
        },
        getCurrentCoordinate: function (data) {
            var leftTopPoint = mapHouse.map.getBounds().getNorthEast(),
                rightBottomPoint = mapHouse.map.getBounds().getSouthWest();
            var currentCoordinate = rightBottomPoint.lng + '+' + rightBottomPoint.lat + '+' + leftTopPoint.lng + '+' + leftTopPoint.lat;//区域点击时的页面右下左上的坐标
            return currentCoordinate;
        },
        clearDisAndBlk: function () {
            mapHouse.transientUpdateParam = null;
            window.inNeed.district = '';
            window.inNeed.block = '';
        },
        getTogether: function (isClear) {//聚合参数
            if (isClear) {
                mapHouse.clearDisAndBlk();
            }
            var pptype = window.inNeed.pptype,//类型
                room = mapHouse.household ? mapHouse.household : window.inNeed.room,//户型只有二手房有
                community = window.inNeed.sinaid,//小区
                district = mapHouse.transientUpdateParam ? mapHouse.transientUpdateParam.district : window.inNeed.district,//区域
                block = mapHouse.transientUpdateParam ? mapHouse.transientUpdateParam.block : window.inNeed.block,//板块
                keyWord = $('.map_input').val(),
                getTogetherData = [];
            if (pptype && pptype != 'undefined') {
                getTogetherData.push('t' + pptype);
            }
            if (room && room != 'undefined') {
                getTogetherData.push('e'+room);
            }
            if (community && community != 'undefined') {
                getTogetherData.push('mi' + community);
            }
            if (district && district != 'undefined') {
                getTogetherData.push('ak' + district);
            }
            if (block && block != 'undefined') {
                getTogetherData.push('bk' + block);
            }
            keyWord && getTogetherData.push('o' + keyWord.replace('二手房', ''));
            return (getTogetherData.length ? '-' : '') + getTogetherData.join('-');
        },
        myClearOverlays: function () {
            var curOverlays = mapHouse.map.getOverlays();
            if (!curOverlays.length) {
                return;
            }
            for (var i = 0; i < curOverlays.length; i++) {
                if (curOverlays[i].obj.hasClass('pos_point_out')) {
                    curOverlays.splice(i, 1);
                    break;
                }
            }
            for (var j = 0; j < curOverlays.length; j++) {
                mapHouse.map.removeOverlay(curOverlays[j]);
            }
        },
        clearOverlayNotLine: function () {
            var curZomm = mapHouse.map.getZoom();
            if (mapHouse.isSubway) {
                $.each(mapHouse.map.getOverlays(), function (i, v) {
                    if (i != 0) {
                        if ($(v.V).hasClass('pos_a')) {
                            mapHouse.map.removeOverlay(v)
                        }
                    }
                });
            } else {
                mapHouse.myClearOverlays();
            }
        },
        addCssAnimation: function (ele, className1, className2, type, time) {
            if (type == 1) {
                ele.addClass(className1).addClass('animated').show();
                mapHouse.stopTouchMove();
            }
            if (type == 2) {
                ele.removeClass(className1).addClass(className2);
                var t = window.setTimeout(function () {
                    ele.removeClass(className1).removeClass(className2);
                    ele.hide();
                    clearTimeout(t);
                    t = null;
                    mapHouse.releaseTouchMove();
                }, time || 400)
            }
        }
        ,

        slideIn: function () {
            $('body').on('click', function (e) {
                var $cur = $(e.target),
                    $input = $('.map_input').get(0);
                if ($cur.hasClass('go_back')) {
                    $input.blur();
                } else if ($cur.hasClass('box_in') || $cur.hasClass('search_input')) {
                    $input.focus();
                }
            });
            $('.box_in').on('click', function (e) {
                //e.stopPropagation();
                $('.result_list').hide();
                $('.screen').show();
                mapHouse.addCssAnimation($('.search_fn_box'), 'slideInRight', '', 1);
                if (mapHouse.isLoadHistory == false) {
                    mapHouse.readHistory();//历史记录
                    mapHouse.isLoadHistory = true;
                }
                if ($('input[name="searchVal"]').val() != '') {
                    $('.clear_input').show();
                }
                //mapHouse.map.centerAndZoom(new BMap.Point(inNeed.lng, inNeed.lat), mapHouse.zoom);//初始化地图位置
            });
            $('.go_back').on('click', function (e) {
                mapHouse.addCssAnimation($('.search_fn_box'), 'slideInRight', 'slideOutRight', 2);
                setTimeout(mapHouse.setMapHeight,500);
            });

        }
        ,

        clearKeyWord: function () {
            $('.map_input').val('')
            $('.box_in .search_input').text('请输入区域或小区名称');
        },
        noResultDeal: function () {
            alert('没有符合条件的结果，请修改条件或关键字');
            window.location.reload();
        },
        resuleAddOverLayFn: function (coordinate, data, zoom, secendRequest, isreload) {
            var url = 'http://' + window.curcityEn + '.esf.sina.com.cn/map/xquery/?bounds=' + coordinate + '&zoom=' + (zoom ? zoom : mapHouse.zoom) + '&q=i1' + (data ? data : "") + '&callback=?';

            $.getJSON(url, function (res) {
                //console.log(res);
                mapHouse.isWhenZommGetData = true;
                if (res && res.code == 0) {
                    var matchKeyword = $.type(res.data.matchKeyword) == 'object' ? res.data.matchKeyword : null;//精准匹配只会有一个结果
                    var facet = res.data.facet;
                    //没有精准匹配并且有搜索关键字
                    if ($('.map_input').val() && $.type(res.data.matchKeyword) != 'object' && facet) {
                        mapHouse.isSearching = true;
                    }
                    //有精准匹配
                    if (matchKeyword) {
                        if (matchKeyword.baidu_x == 0 || matchKeyword.baidu_y == 0) {
                            mapHouse.noResultDeal();
                            return;
                        } else {
                            mapHouse.map.setCenter(new BMap.Point(matchKeyword.baidu_x, matchKeyword.baidu_y));
                            setTimeout(function () {
                                !secendRequest && mapHouse.resuleAddOverLayFn(mapHouse.getCurrentCoordinate(), data, zoom, true);
                            }, 100)
                        }
                        if (secendRequest) {
                            mapHouse.isWhenZommGetData = false;
                            if (!facet) {
                                mapHouse.noResultDeal();
                                return;
                            }
                            for (var i in facet) {
                                var search_count = facet[i][0].search_count;
                            }
                            search_count = search_count ? search_count : 0;
                            matchKeyword.search_count = search_count;
                            mapHouse.isMatchKeyword = true;
                            var type = matchKeyword.type,
                                id = matchKeyword.id,
                                sinaid = matchKeyword.sinaid;
                            switch (type) {
                                case "district":
                                    mapHouse.map.setZoom(12);
                                    mapHouse.map.addOverlay(mapHouse.addDistrictBlockOverlay.createNew(matchKeyword));
                                    break;
                                case "block":
                                    mapHouse.map.setZoom(14);
                                    mapHouse.map.addOverlay(mapHouse.addDistrictBlockOverlay.createNew(matchKeyword));
                                    break;
                                default:
                                    mapHouse.map.setZoom(16);
                                    mapHouse.map.addOverlay(mapHouse.addCommunityOverlay.createNew(matchKeyword));
                                    setTimeout(function () {
                                        $('.community_overLayer').trigger('touchstart')
                                    }, 500)
                                    break;
                            }
                            var tmpst = setTimeout(function(){
                                mapHouse.isWhenZommGetData = true;
                                clearTimeout(tmpst);
                                tmp = null;
                            },300);
                            
                        }
                    } else if (res.data.facet) {
                        mapHouse.myClearOverlays();
                        mapHouse.isWhenZommGetData = false;
                        var isSetPop = true;
                        var firstItem = null;
                        var goodComm = [];
                        for (var type in res.data.facet) {
                            var resDate = res.data.facet[type];
                            for (var i in resDate) {
                                var item = resDate[i];
                                if(i==0){
                                    firstItem = resDate[i];
                                }
                                if (item.baidu_x == 0 || item.baidu_y == 0) {
                                    continue;
                                } else {
                                    if (type == "district" || type == "block") {
                                        if (resDate.length == 1) {
                                            type == "district" ?
                                                mapHouse.map.setZoom(12) : mapHouse.map.setZoom(14)
                                            mapHouse.isFirstLoad && mapHouse.map.setCenter(new BMap.Point(item.baidu_x, item.baidu_y));
                                            mapHouse.map.addOverlay(mapHouse.addDistrictBlockOverlay.createNew(item, inNeed.tradetype));
                                        } else {
                                            mapHouse.map.addOverlay(mapHouse.addDistrictBlockOverlay.createNew(item, inNeed.tradetype));
                                        }

                                    } else if (type == 'sinaid') {//精确匹配小区
                                        mapHouse.map.addOverlay(mapHouse.addCommunityOverlay.createNew(item, inNeed.tradetype));

                                        if(isSetPop&&isreload&&(mapHouse.transientUpdateParam.district? mapHouse.transientUpdateParam.district == item.districtid:true)){
                                            goodComm.push(item);
                                        }
                                    }
                                }

                            }
                        }
                        if(isSetPop&&isreload){
                            isSetPop = false;
                            goodComm.length?mapHouse.map.setCenter(new BMap.Point(goodComm[0].baidu_x, goodComm[0].baidu_y)):mapHouse.map.setCenter(new BMap.Point(firstItem.baidu_x, firstItem.baidu_y))
                        }
                        var tmpst = setTimeout(function(){
                            mapHouse.isWhenZommGetData = true;
                            clearTimeout(tmpst);
                            tmp = null;
                        },300);
                        mapHouse.isFirstLoad = false;
                    } else {
                        //无结果，清楚bounds再试试 仅一次
                        !isreload ? mapHouse.resuleAddOverLayFn('', data, zoom, null, true) : noResultDeal();
                        return;
                    }
                    $('.map_input').val() && $('.box_in .search_input').text($('.map_input').val());
                } else {
                    alert('接口出错')
                }
            })
        }
        ,

        initSH: function () {
            $('input[name="searchVal"]').on('input', function (e) {
                e.stopPropagation();
                var dbfn = mapHouse.debounce(mapHouse.postSH, 300);
                $(this).off('input').on('input', dbfn);
                dbfn();
            });
            mapHouse.clearInput();//清除搜索输入内容
        }
        ,

        debounce: function (func, wait, immediate) {
            var timeout, args, context, timestamp, result;
            var later = function () {
                var last = new Date().getTime() - timestamp;
                if (last < wait && last >= 0) {
                    timeout = setTimeout(later, wait - last);
                } else {
                    timeout = null;
                    if (!immediate) {
                        result = func.apply(context, args);
                        if (!timeout) context = args = null;
                    }
                }
            };
            return function () {
                context = this;
                args = arguments;
                timestamp = new Date().getTime();
                var callNow = immediate && !timeout;
                if (!timeout) timeout = setTimeout(later, wait);
                if (callNow) {
                    result = func.apply(context, args);
                    context = args = null;
                }
                return result;
            };
        }
        ,
        throttle:function(func, wait, options) {
            /* options的默认值
             *  表示首次调用返回值方法时，会马上调用func；否则仅会记录当前时刻，当第二次调用的时间间隔超过wait时，才调用func。
             *  options.leading = true;
             * 表示当调用方法时，未到达wait指定的时间间隔，则启动计时器延迟调用func函数，若后续在既未达到wait指定的时间间隔和func函数又未被调用的情况下调用返回值方法，则被调用请求将被丢弃。
             *  options.trailing = true; 
             * 注意：当options.trailing = false时，效果与上面的简单实现效果相同
             */
            var context, args, result;
            var timeout = null;
            var previous = 0;
            if (!options) options = {};
            var later = function() {
              previous = options.leading === false ? 0 : new Date().getTime();
              timeout = null;
              result = func.apply(context, args);
              if (!timeout) context = args = null;
            };
            return function() {
              var now = new Date().getTime();
              if (!previous && options.leading === false) previous = now;
              // 计算剩余时间
              var remaining = wait - (now - previous);
              context = this;
              args = arguments;
              // 当到达wait指定的时间间隔，则调用func函数
              // 精彩之处：按理来说remaining <= 0已经足够证明已经到达wait的时间间隔，但这里还考虑到假如客户端修改了系统时间则马上执行func函数。
              if (remaining <= 0 || remaining > wait) {
                // 由于setTimeout存在最小时间精度问题，因此会存在到达wait的时间间隔，但之前设置的setTimeout操作还没被执行，因此为保险起见，这里先清理setTimeout操作
                if (timeout) {
                  clearTimeout(timeout);
                  timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
              } else if (!timeout && options.trailing !== false) {
                // options.trailing=true时，延时执行func函数
                timeout = setTimeout(later, remaining);
              }
              return result;
            };
          },

        postSH: function () {
            var keyword = mapHouse.searchInput.val(),
                postD = {
                    keyword: keyword,
                };
            if (postD.keyword && postD.keyword != '') {                       //输入框中有值才发请求
                $(".search_result_box").show();
                $('.clear_input').show();
                mapHouse.postData(mapHouse.shUrl, postD, mapHouse.renderSH);
            } else if (!postD.keyword || postD.keyword == '') {
                $('.clear_input').hide();
                mapHouse.readHistory();
            }
        }
        ,

        postData: function (url, data, fn, noFn, isAsync) {
            url += '?citycode=' + window.city + "&homeaddress=1&tag=1&callback=?";
            var returnData = {};
            $.getJSON(url, data, function (res) {
                var res = (typeof res == 'string') ? JSON.parse(res) : res;
                //console.log(res);//接口返回信息
                if (res.code == 0) {
                    fn ? fn(res) : false;
                    if (!isAsync) {
                        returnData = res;
                    }
                } else {
                    mapHouse.readHistory();
                    noFn ? noFn(res) : console.log("返回信息" + res.message);
                }
            });
            return returnData;
        }
        ,
        /**
         * 添加返回结果
         */
        renderSH: function (res) {
            if (res && res.code == 0) {
                //console.log(res);
                var html = baidu.template(mapHouse.searchDownList, res);
                $('.search_result_list').html(html);
                $('.search_history_box,.history_list').hide();
            } else {
                //console.log(res.message);
                $('.search_history_box,.history_list').hide();
            }
        }
        ,

        clearInput: function () {
            $('.clear_input').on('click', function (e) {
                e.stopPropagation();
                if ($('.history_list').css('display') == 'none') {
                    $('.search_result_list').html('');
                }
                $('input[name="searchVal"]').val('');
                mapHouse.clearKeyWord();
                $(this).hide();
                mapHouse.readHistory();
                mapHouse.isLoadHistory = false;
            })
        }
        ,

        mapscreen: function () {
            $('.screen').on('click', function (e) {
                e.stopPropagation();
                if ($('.screen_ul').css('display') == 'none') {
                    $('.pop_layer').show();
                    mapHouse.addCssAnimation($('.screen_ul'), 'zoomIn', '', 1);
                    setTimeout(function () {
                        $('.screen').addClass('change_op');
                    }, 200)
                } else {
                    $('.pop_layer').hide();
                    mapHouse.addCssAnimation($('.screen_ul'), 'zoomIn', 'zoomOut', 2);
                    setTimeout(function () {
                        $('.screen').addClass('change_op');
                    }, 200)
                }
            });
        }
        ,

        closeScreen: function () {
            var popLayer = $('.pop_layer'), screen = $('.screen'), tipBox = $('.changeCity_tip_box');
            $('.pop_layer,.pop_layer2').on('click', function (e) {
                e.stopPropagation();
                mapHouse.addCssAnimation($('.screen_ul'), 'zoomIn', 'zoomOut', 2);
                $('.pop_layer,.pop_layer2').hide();
                if (tipBox.css('display') == 'block') {
                    tipBox.hide();
                }
                screen.removeClass('change_op');
            });
            $('.screen_ul').on('click', 'li', function (e) {
                e.stopPropagation();
                var tt = $(this), index = $(this).index();
                mapHouse.household = tt.find('a').attr('data-param')?tt.find('a').attr('data-param').replace('e',''):'';
                if (index != 0) {
                    screen.find('i').show();
                    screen.find('span').html(tt.find('a').text());
                    $('.result_screen').find('span').text(tt.find('a').text());
                    screen.addClass('bg_none');
                } else {
                    screen.find('i').hide();
                    screen.find('span').html('');
                    $('.result_screen').find('span').text('户型筛选');
                    screen.removeClass('bg_none');
                }
                tt.addClass('on').siblings('li').removeClass('on');
                mapHouse.addCssAnimation($('.screen_ul'), 'zoomIn', 'zoomOut', 2);
                popLayer.hide();
                screen.removeClass('change_op');
                var currentCoordinate = mapHouse.getCurrentCoordinate();

                mapHouse.getMapData();
            });

        }
        ,

        resultScreen: function () {
            $('.result_screen').on('click', function (e) {
                e.stopPropagation();
                if ($(this).attr('openStyle') == 'open') {
                    mapHouse.addCssAnimation($('.result_ul'), 'bounceIn', '', 1);
                    $(this).attr('openStyle', 'close');
                } else {
                    mapHouse.addCssAnimation($('.result_ul'), 'bounceIn', 'bounceOut', 2);
                    $(this).attr('openStyle', 'open');
                }
            });
            $('.result_ul').on('click', 'li', function (e) {
                e.stopPropagation();
                var index = $(this).index();
                if (index != 1) {
                    $('.result_screen').find('span').text($(this).find('a').text());
                } else {
                    $('.result_screen').find('span').text('户型筛选');
                }
                mapHouse.household = $(this).find('a').attr('data-param')?$(this).find('a').attr('data-param').replace('e',''):'';
                mapHouse.addCssAnimation($('.result_ul'), 'bounceIn', 'bounceOut', 2);
                $('.result_screen').attr('openStyle', 'open');
                //mapHouse.getMapData();
                mapHouse.nextPageFn();
            })
        }
        ,
        loadJScript: function () {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = "http://api.map.baidu.com/api?v=2.0&ak=aIZWuZjqkxKk1wz447gGAmxc&callback=mapHouse.mapHouseInit&t=" + new Date().getTime();
            document.body.appendChild(script);
            mapHouse.setMapHeight();
        }
        ,
        //设置地图大小
        setMapHeight: function () {
            var h = $(window).height(),
                t = $('.header').height();
            $('#allMap').height(h - t) + 'px';
            $('#my_pos').show();
        }
        ,
        recommendClickFn: function () {
            $('.ul_box').on('click', 'li', function (e) {
                e.stopPropagation();
                var text = $(this).find('a').text(),
                    currentCoordinate = mapHouse.getCurrentCoordinate();
                if (text && text == 'undefined') {
                    alert('数据错误');
                    return;
                }

                $('.map_input').val($(this).find('a').text());
                $('.box_in .search_input').text($(this).find('a').text());
                $('.search_btn').trigger('click')
                mapHouse.addCssAnimation($('.search_fn_box'), 'slideInRight', 'slideOutRight', 2);
            })
        }
        ,
        mapEnt: function () {
            mapHouse.timeInterval = true;
            mapHouse.transientUpdateFacet = mapHouse.isSubway && mapHouse.map.getZoom() < mapHouse.zoomMid ? false : true;
            mapHouse.transientUpdateFacet && mapHouse.doMapUpdate();
        },
        doMapUpdate: function () {
            window.setTimeout(function () {
                if (!mapHouse.timeInterval) return;
            }, 1000);
        },
        //百度地图功能
        mapHouseInit: function () {
            mapHouse.isFirstLoad = true;
            mapHouse.map = new BMap.Map("allMap", {minZoom: mapHouse.zoom, enableMapClick: false});    // 创建Ma
            mapHouse.map.centerAndZoom(new BMap.Point(inNeed.lng, inNeed.lat), mapHouse.zoom);
            mapHouse.map.enableAutoResize();
            //mapHouse.map.disableDoubleClickZoom();

            window.geolocationControl = new BMap.GeolocationControl();
            geolocationControl.addEventListener("locationSuccess", function (e) {
                var city = e.addressComponent.city,
                    lng = e.point.lng,
                    lat = e.point.lat;
                localStorage.setItem('mypos',JSON.stringify(e));
                if (city.indexOf(window.curcityCn)==-1) {
                    $('.pop_layer2,.changeCity_tip_box').show();
                    $.get(window.currenturl + '/location/latlng2city',{
                        latitude:lat,
                        longitude:lng
                    },function(res){
                        window.location.href = currenturl.replace("\/" + curcityEn, "\/" + JSON.parse(res).data.cityEn) + '/map/?fromother=1';
                    });
                }else{
                    var address = '';
                    address += e.addressComponent.city;
                    address += e.addressComponent.district;
                    address += e.addressComponent.street;
                    address += e.addressComponent.streetNumber;
                    mapHouse.map.addOverlay(mapHouse.addMyPosition.createNew({
                        baidu_x:lng,
                        baidu_y:lat,
                        address:address
                    }));
                    
                    $('.result_list').hide();
                    mapHouse.clearKeyWord();
                    mapHouse.setMapHeight();
                    mapHouse.transientUpdateParam = null;
                    setTimeout(function(){
                        mapHouse.map.setCenter(new BMap.Point(lng,lat));
                        mapHouse.getMapData();
                    },200);
                }
            });
            geolocationControl.addEventListener("locationError", function (e) {
                alert(e.message);
            });
            //mapHouse.map.addControl(geolocationControl);

            if(window.location.search.indexOf('fromother')!=-1){
                geolocationControl.location();
            }

            $('#my_pos').on('touchstart',function(){
                var curO = mapHouse.map.getOverlays();
                var hasMypos = null;
                if(curO.length){
                    for(var i=0;i<curO.length;i++){
                        if(curO[i].obj){
                            if(curO[i].obj.hasClass('pos_point_out')){
                                hasMypos = true;
                                break;
                            }
                        }
                    }
                }
                if(localStorage.getItem('mypos')&&hasMypos){
                    var mypos = JSON.parse(localStorage.getItem('mypos'));
                    mapHouse.map.setCenter(new BMap.Point(mypos.point.lng,mypos.point.lat));
                    mapHouse.getMapData();
                }else{
                    geolocationControl.location();
                }
                
            })
            .on('touchend touchmove',function(e){
                return false;
            });
            
            var formaterData = mapHouse.getTogether();
            var correspondingDisZoom = window.inNeed.district, // 对应列表页点击进来时候的区域板块是否被选中
                correspondingBlockZoom = window.inNeed.block;
            var posLng, posLat, initializationZoom = 12;

            mapHouse.map.addEventListener('click', function () {
                $('#my_pos_tips').hide();
            });

            if (mapHouse.household) {
                $('[data-param=e' + mapHouse.household + ']').parent().addClass('on')
            }

            if (!correspondingDisZoom && !correspondingBlockZoom) {
                var currentCoordinate = mapHouse.getCurrentCoordinate();
                mapHouse.resuleAddOverLayFn(currentCoordinate, formaterData, initializationZoom);
            } else {
                mapHouse.getMarkData(function (res) {
                    var resData = res.data,
                        disId = window.inNeed.district,
                        blockId = window.inNeed.block;
                    if (disId && blockId) {
                        for (var i = 0; i < resData.length; i++) {
                            if (resData[i].id == disId) {
                                var block = resData[i].block;
                                for (var j = 0; j < block.length; j++) {
                                    if (block[j].id == blockId) {
                                        posLng = block[j].baidu_x;
                                        posLat = block[j].baidu_y;
                                    }
                                }
                            }
                        }
                    } else if (disId && !blockId) {
                        for (var i in resData) {
                            if (resData[i].id == disId) {
                                posLng = resData[i].baidu_x;
                                posLat = resData[i].baidu_y;
                            }
                        }
                    } else if (!disId && !blockId) {
                        posLng = window.inNeed.lng;
                        posLat = window.inNeed.lat;
                    }
                    if (correspondingDisZoom && correspondingBlockZoom) {
                        initializationZoom = 14;
                        //mapHouse.map.centerAndZoom(new BMap.Point(posLng, posLat), initializationZoom);//初始化地图位置
                    }
                    if (correspondingDisZoom && !correspondingBlockZoom) {
                        initializationZoom = 12;
                        //mapHouse.map.centerAndZoom(new BMap.Point(posLng, posLat), initializationZoom);//初始化地图位置
                    }
                    var currentCoordinate = mapHouse.getCurrentCoordinate();
                    mapHouse.resuleAddOverLayFn(currentCoordinate, formaterData, initializationZoom);

                });
            }
            mapHouse.map.addEventListener('zoomstart', function () {
                mapHouse.curzoom = mapHouse.map.getZoom();
                mapHouse.isSearching = false;
            });
            mapHouse.map.addEventListener('zoomend', function () {
                //mapHouse.myClearOverlays();
                if (mapHouse.map.getZoom() < mapHouse.curzoom) {
                    mapHouse.clearDisAndBlk();
                }
                mapHouse.isWhenZommGetData && mapHouse.getMapData();
            });
            mapHouse.map.addEventListener('dragstart', function () {
                mapHouse.isSearching = false;
            });
            mapHouse.map.addEventListener('dragend', function () {
                mapHouse.clearKeyWord();
                //mapHouse.myClearOverlays();
                mapHouse.clearDisAndBlk();
                mapHouse.getMapData();
            });
            mapHouse.map.addEventListener('resize', function () {
            });
        },
        getMapData: function (isclear) {
            mapHouse.resuleAddOverLayFn(mapHouse.getCurrentCoordinate(), mapHouse.getTogether(isclear), mapHouse.map.getZoom());
        }
        ,
        //定位
        myPos: function () {
            $('#my_pos').on('touchstart', function (e) {
                e.stopPropagation();
                e.preventDefault();
                // GeoHelper.getCurrentPosition({ // 访问检测
                //     bForceRequest: true,
                //     bCheckCity: true,
                // });
            }).on('touchend touchmove', function () {
                return false;
            });
        },

        goToListPage: function () {
            $('.list_change').on('click', function (e) {
                e.stopPropagation();
                var disId = mapHouse.transientUpdateParam ? mapHouse.transientUpdateParam.district : window.inNeed.district,//区域
                    blockId = mapHouse.transientUpdateParam ? mapHouse.transientUpdateParam.block : window.inNeed.block,//板块
                    urlStr = '';
                mapHouse.getMarkData(function (res) {
                    var data = res.data;
                    blockArr = null;

                    if (disId && disId != '') {
                        $.each(data, function (i, v) {
                            if (v.id == disId) {
                                disId = v.mark;
                                blockArr = v.block;
                                return false;
                            }
                        });
                        urlStr += 'a' + disId;
                    }
                    if (blockId && blockId != '') {
                        blockArr && $.each(blockArr, function (i, v) {
                            if (v.id == blockId) {
                                blockId = v.mark;
                                return false;
                            }
                        });
                        urlStr += '-b' + blockId;
                    }
                    if (window.inNeed.pptype) {
                        urlStr += ((urlStr != '') ? '-' : '') + 't' + parseInt(window.inNeed.pptype);
                    }
                    if ($('.screen_ul li.on').length) {
                        urlStr += ((urlStr != '') ? '-' : '') + $('.screen_ul li.on').children('a').data('param');
                    }
                    window.location.href = window.currenturl + /house/ + urlStr;
                });
            })
        },
        closeResultListFn: function () {
            $('.allMap').on('click', function (e) {
                e.stopPropagation();
                if ($('.result_list').css('display') == 'block') {
                    mapHouse.map.enableDragging();
                    $('.result_list').hide();
                    if (mapHouse.lastCommnity) {
                        setTimeout(function () {
                            mapHouse.map.panTo(new BMap.Point(mapHouse.lastCommnity.x, mapHouse.lastCommnity.y));
                        }, 500);
                    }
                    //更新居室
                    mapHouse.household = $('.screen_ul>li.on>a').data('param')?$('.screen_ul>li.on>a').data('param').replace('e',''):'';
                    if (mapHouse.lastCommnity) {
                        setTimeout(function () {
                            mapHouse.map.panTo(new BMap.Point(mapHouse.lastCommnity.x, mapHouse.lastCommnity.y));
                        }, 500);
                        $('.community_overLayer.on').removeClass('on').addClass('active')
                    }

                }
                
                mapHouse.showSt = setTimeout(function () {
                    $('.map_search').show();
                    if ($('.screen ').css('display') == 'none') {
                        $('.screen').show();
                    }
                    clearTimeout(mapHouse.showSt);
                    mapHouse.showSt = null;
                }, 300);
                mapHouse.setMapHeight();
            });
        }
        ,
        searchFn: function () {
            $('.search_btn').on('click', function (e) {
                e.stopPropagation();
                mapHouse.isWhenZommGetData = false;
                mapHouse.myClearOverlays();
                mapHouse.map.setZoom(inNeed.zoom)
                window.inNeed.district = window.inNeed.block = '';
                var keyWord = mapHouse.searchKeyWord = $('input[name="searchVal"]').val();

                //无结果定位到初始状态
                if (keyWord) {
                    $('.box_in .search_input').text(keyWord);
                    var s = setTimeout(function(){
                        mapHouse.isWhenZommGetData = true;
                        mapHouse.getMapData();
                        clearTimeout(s);
                        s = null;
                    },300)
                    
                } else {
                    mapHouse.map.centerAndZoom(new BMap.Point(inNeed.lng, inNeed.lat), inNeed.zoom);
                    $('.box_in .search_input').text('请输入区域或小区名称');
                }
                mapHouse.addCssAnimation($('.search_fn_box'), 'slideInRight', 'slideOutRight', 2, 0);
                mapHouse.isSearching = false;
            })
        }
        ,
        deleteArrRepeat: function (obj) {
            var tempArray = [];
            var temp = "";
            var index = 0;
            for (var i = 0; i < obj.length; i++) {
                temp = obj[i];
                for (var j = 0; j < tempArray.length; j++) {
                    if (temp == tempArray[j]) {
                        temp = "";
                        break;
                    }
                }
                if (temp == null || temp != "") {
                    tempArray[index] = temp;
                    index++;
                }
            }
            return tempArray;
        },
        resultClickFn: function () {
            $('.search_result_list').on('click', 'li', function (e) {
                e.stopPropagation();
                mapHouse.myClearOverlays();
                mapHouse.clearKeyWord();
                var type = $(this).attr('itemType');
                var searchZoom = '';//模糊搜索时的缩放类型
                var mapHistoryKw = $(this).find('em').text();
                if (typeof localStorage.setItem == 'function') {
                    var localData = localStorage.getItem('mapHouseSearchKeyword') ? localStorage.getItem('mapHouseSearchKeyword').split(',') : '';
                    if (localData.length > 10) {
                        localData = localData.slice(0, 10);
                    }
                    if (localData.length == 10) {
                        localData.shift();
                    }
                    if (localData == '') {
                        var localData = [];
                        localData.push(mapHistoryKw);
                    } else {
                        localData.push(mapHistoryKw);
                    }
                    localStorage.setItem('mapHouseSearchKeyword', localData.join(','));
                }
                switch (type) {
                    case 'district':
                        searchZoom = 12;
                        $('.result_list').hide();
                        $('.screen').show();
                        break;
                    case 'block':
                        searchZoom = 14;
                        $('.result_list').hide();
                        $('.screen').show();
                        break;
                    case 'community':
                        searchZoom = 16;
                        $('.screen').hide();
                        break;
                }
                //更新搜索关键字
                $('.map_input').val(mapHistoryKw);
                $('.box_in .search_input').text(mapHistoryKw);
                mapHouse.addCssAnimation($('.search_fn_box'), 'slideInRight', 'slideOutRight', 2);
                var keyWord = mapHouse.searchKeyWord = $(this).find('em').text().replace('二手房', '');//提供地铁的定位点
                var currentCoordinate = mapHouse.getCurrentCoordinate();

                var formaterData = mapHouse.getTogether(true);
                mapHouse.resuleAddOverLayFn(currentCoordinate, formaterData, searchZoom);//searchZoom 搜索时候的缩放等级
            })
        },
        clearHistoryFn: function () {
            $('.history_list').on('click', function (e) {
                e.stopPropagation();
                $('.search_result_list').html('');
                $(this).hide();
                localStorage.setItem('mapHouseSearchKeyword', '');
            })
        },
        getMarkData: function (fn) {
            var url = 'http://' + window.city + '.esf.sina.com.cn/di/districtBlock?citycode=' + window.city + '&callback=?';
            $.getJSON(url, function (res) {
                fn && fn(res);
            });
        }
        ,
        addMyPosition: {
            createNew: function (data) {
                var MyPos = new BMap.Overlay();
                MyPos.data = data;
                MyPos.initialize = function (map) {
                    this.map = map;
                    this.data = data;
                    var html = [];
                    html.push('<div class="pos_point_out">' +
                        '<span id="pos_point"></span>' +
                        '<section>' +
                        '<div class="my_pos_tips" id="my_pos_tips">'+data.address+'<q></q></div>' +
                        '</section>' +
                        '</div>');
                    var obj = this.obj = $(html.join(''));
                    obj.on('touchstart', function (e) {
                        $(this).find('.my_pos_tips').show().css({
                            left:-$(this).find('.my_pos_tips').width()/2+'px'
                        })
                    }).on('click touchmove touchend', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    })

                    map.getPanes().labelPane.appendChild(obj[0]);
                    return obj[0];
                };
                MyPos.draw = function () {
                    var map = this.map;
                    var data = this.data;
                    var obj = this.obj;
                    var pixel = map.pointToOverlayPixel(new BMap.Point(data.baidu_x, data.baidu_y));
                    obj.css('left', (pixel.x - obj.width() / 2) + 'px');
                    obj.css('top', (pixel.y - obj.height() / 2) + 'px');
                }
                return MyPos;
            }
        },
        run:function(){alert(1)},
        addDistrictBlockOverlay: {
            createNew: function (data) {
                var DBOverlay = new BMap.Overlay();
                DBOverlay.data = data;
                DBOverlay.initialize = function (map) {
                    this.map = map;
                    this.data = data;
                    var html = [];
                    html.push('<ul class="dist_overLayer" data-id="' + data.id + '"><li class="dist_name">' + data.name + '</li><li class="dist_num">' + data.search_count + '</li></ul>');
                    var obj = this.obj = $(html.join(''));
                    var  s = null,ss = null;
                    function run(e){
                        //e.stopPropagation();
                        e.preventDefault();
                        mapHouse.onclick = mapHouse.tmpfun;
                        mapHouse.myClearOverlays();
                        !mapHouse.isSearching && mapHouse.clearKeyWord();
                        if (0 == data.parent) {
                            mapHouse.transientUpdateParam = {
                                district: data.id
                            }
                            var disId = mapHouse.districtOverLayerID = $(this).attr('data-id');//区域ID
                            mapHouse.map.centerAndZoom(new BMap.Point(data.baidu_x, data.baidu_y), 14);
                        } else {
                            mapHouse.transientUpdateParam = {
                                district: data.parent,
                                block: data.id
                            }
                            map.setCenter(new BMap.Point(data.baidu_x, data.baidu_y));
                            map.setZoom(16);
                        }
                    }
                    map.getPanes().labelPane.appendChild(obj[0]);

                    $(obj[0]).on('touchstart',function(e){
                        s = setTimeout(function(){
                            run(e);
                            clearTimeout(s);
                            s = null;
                        },300);
                    }).on('touchmove',function(e){
                        e.stopPropagation();
                        ss = setTimeout(function(){
                            $(obj[0]).off('touchmove').on('touchmove',function(){
                                clearTimeout(s);
                                s = null;
                            });
                            clearTimeout(ss)
                            ss = null
                        },100);
                        
                    }).on('touchend',function(){
                        clearTimeout(ss);
                        ss = null;
                    });
                    return obj[0];
                };
                DBOverlay.draw = function () {
                    var map = this.map;
                    var data = this.data;
                    var obj = this.obj;
                    var pixel = map.pointToOverlayPixel(new BMap.Point(data.baidu_x, data.baidu_y));
                    obj.css('left', (pixel.x - obj.width() / 2) + 'px');
                    obj.css('top', (pixel.y - obj.height() / 2) + 'px');
                }
                return DBOverlay;
            }
        },
        addCommunityOverlay: {
            createNew: function (data) {
                var communityOverlay = new BMap.Overlay();
                communityOverlay.data = data;
                communityOverlay.initialize = function (map) {
                    this.map = map;
                    var data = this.data;
                    var obj = this.obj = $('<div class="community_overLayer" baiduY="' + data.baidu_y + '" baiduX="' + data.baidu_x + '" current_page="' + data.current_page + '" communityname="' + data.communityname + '" avgprice_w="' + data.avgprice_w + '" avgprice="' + data.avgprice + '" data-id="' + data.sinaid + '"><span class="community_num"><i>' + (data.search_count ? data.search_count : data.salecount) + '</i>套</span><em></em><span class="community_avgprice"><i>' + data.avgprice_w + '</i>万</span><q></q></div>');
                    var s = null,ss = null;
                    obj.on('touchstart', function (e) {
                        var tt = $(this);
                        s = setTimeout(function(){
                            mapHouse.map.disableDragging()
                            clearTimeout(mapHouse.showSt);
                            mapHouse.showSt = null
                            if (tt.hasClass('on')) {
                                return
                            }
                            tt.addClass('on').siblings('div').each(function () {
                                if ($(this).hasClass('on')) {
                                    $(this).removeClass('on').addClass('active');
                                }
                            });
                            mapHouse.lastCommnity = {
                                x: data.baidu_x,
                                y: data.baidu_y
                            }
                            $('.result_list').show();
                            $('.result_screen>a>span').text($('.screen_ul li.on>a').text());
                            $('body,html').on('touchmove', '.mapHouseMain', function (e) {
                                e.stopPropagation();
                                e.preventDefault();
                            });
                            var h = $(window).height() - $('.header').height() - $('.result_list').height();
                            $('#allMap').height(h);
                            $('#my_pos').hide();
                            //设置当前小区为中心点
                            setTimeout(function () {
                                mapHouse.map.panTo(new BMap.Point(data.baidu_x, data.baidu_y));
                            }, 300);
                            var sinaId = tt.attr('data-id'),
                                avgprice = tt.attr('avgprice'),
                                communityname = tt.attr('communityname'),
                                current_page = tt.attr('current_page'),
                                baiduX = tt.attr('baiduX'),
                                baiduY = tt.attr('baiduY');
                            //mapHouse.map.setCenter(new BMap.Point(baiduX, baiduY));
                            mapHouse.currentCommunitySinaId = sinaId;
                            $('.community_info').find('a').attr('href', currenturl + '/info/' + sinaId);
                            $('.res_community_name').text(communityname);
                            $('.avgprice').text('均价' + avgprice + '元/㎡');
                            $('.screen').hide();
                            mapHouse.nextPageFn();//加载更多
                            $('.map_search').hide();
                            clearTimeout(s);
                            s = null;
                        },300);
                    }).on('touchmove',function(e){
                        e.stopPropagation();
                        ss = setTimeout(function(){
                            $(obj[0]).off('touchmove').on('touchmove',function(){
                                clearTimeout(s);
                                s = null;
                            });
                            clearTimeout(ss)
                            ss = null
                        },100);
                    }).on('touchend',function(e){
                        clearTimeout(ss);
                        ss = null;
                        //e.stopPropagation()
                    });
                    map.getPanes().labelPane.appendChild(obj[0]);
                    return obj[0];
                };
                communityOverlay.draw = function () {
                    var map = this.map;
                    var data = this.data;
                    var obj = this.obj;
                    var pixel = map.pointToOverlayPixel(new BMap.Point(data.baidu_x, data.baidu_y));
                    obj.css('left', (pixel.x - 29) + 'px');
                    obj.css('top', (pixel.y - obj.height()) + 'px');
                };
                return communityOverlay;
            }
        },
        nextPageFn: function () {
            var currentCoordinate = mapHouse.getCurrentCoordinate();
            var formaterData = mapHouse.getTogether();
            $('.house-list').html('');
            $('.load_more_btn').nextpage({
                url: 'http://' + window.curcityEn + '.esf.sina.com.cn/map/xquery/?&zoom=' + mapHouse.map.getZoom() + '&q=i1' + formaterData + '-mi' + mapHouse.currentCommunitySinaId,
                jsonp: 'callback',
                paramters: function (page) {
                    return {
                        page: page
                    };
                },
                scrollObj: $('#wrapper'),
                pageCurrent: 0,
                bLoadOnInit: true,
                urlFormater: function (options, url, pageNext) {
                    return url + '-n' + pageNext;
                },
                processCallback: function (obj, data) {

                },
                dataFormater: function (data) {
                    if (data.data.data.length == 0) {
                        return null;
                    } else {
                        return data.data;
                    }
                }
            });
        }
    }

    window.mapHouse = mapHouse;
    mapHouse.loadJScript();
    mapHouse.initFn();

    var getLocation = {
        bdTemplate: '<li>' +
        '<a href="javascript:void(0);"><%=communityname%></a>' +
        '</li>',
        addLocationHome: function (getObj) {
            var localStr = window.localStorage.getItem(getObj) ? window.localStorage.getItem(getObj).split(',') : '';
            if (localStr != undefined) {//如果能取到就解析
                var localHotHome = '';
                $.each(localStr, function (i, data) {
                    var hotStr = '<li><a href="javascript:void(0);">' + localStr[i] + '</a></li>';
                    localHotHome += hotStr;
                });
                $(".recommended_type").show().removeClass('_location_icon').addClass("_hot_icon").text('热门小区');
                $(".ul_box").find('ul').html(localHotHome);
            } else {//如果取不到，请求接口添加
                getLocation.readAddHome();
            }
        },
        /**
         * 读接口添加热门小区（跨域接口）
         * */
        readAddHome: function () {
            var url = 'http://' + window.curcityEn + '.esf.sina.com.cn/di/hotkeyword/?citycode=' + window.curcityEn + '&callback=?';
            $.getJSON(url, function (res) {
                var res = (typeof res == 'string') ? JSON.parse(res) : res;
                if (res) {
                    var resData = res.data;
                    var hotHtml = '';
                    $.each(resData, function (i, v) {
                        var hotStr = '<li><a href="javascript:void(0);">' + resData[i] + '</a></li>';
                        hotHtml += hotStr;
                    });
                    try {
                        localStorage.setItem('hotHome', resData);
                    } catch (e) {
                        console.error(e.message);
                    }
                    $(".recommended_type").show().addClass("_hot_icon").text('热门搜索');
                    $(".ul_box").find('ul').html(hotHtml);
                } else {
                    $('.recommended_cell').hide();
                    console.log('取不到返回的小区信息');
                }
            });
        },
        successFn: function (pos) {
            //alert('附近请求成功');
            if (pos) {
                //alert('1234567890123')
                var locationData = {
                    x: pos.coords.longitude,//经度
                    y: pos.coords.latitude//纬度
                };
                if (locationData.x != undefined && locationData.y != undefined) {//能获取到X，Y坐标时
                    var url = 'http://' + window.curcityEn + '.esf.sina.com.cn/di/positioncommunity/?citycode=' + window.curcityEn + '&x=' + locationData.x + '&y=' + locationData.y + '&callback=?';
                    $.getJSON(url, function (res) {
                        //alert('PHP有返回');
                        var res = (typeof res == 'string') ? JSON.parse(res) : res;
                        if (res) {//能获取到后台的返回值
                            if (res.data.list == '') {//如果返回来的data是空的，先取缓存的热门
                                //$('#my_pos').hide();//显示定位按钮
                                if (window.localStorage.getItem('hotHome') != null) {
                                    var hotHomeData = window.localStorage.getItem('hotHome').split(',');
                                    getLocation.addLocationHome(hotHomeData);
                                } else {
                                    getLocation.readAddHome();
                                }
                            } else {//有返回值，并且不为空
                                $('#my_pos').css('display', 'block').show();//显示定位按钮
                                var sliceArr = res.data.list.slice(0, 6);
                                var arr = [];
                                $.each(sliceArr, function (i, v) {//循环添加模板
                                    arr.push(baidu.template(getLocation.bdTemplate, v));
                                });
                                var locationTemplate = arr.join('');
                                $(".recommended_type").show().removeClass('_location_icon').addClass("_location_icon").text('附近小区');
                                $(".ul_box").find('ul').html(locationTemplate);
                            }
                        } else {//获取不到后台的返回值
                            //alert('没有返回');
                            if (window.localStorage.getItem('hotHome')) {

                                getLocation.addLocationHome('hotHome');
                            } else {
                                getLocation.readAddHome();
                            }
                        }
                    })
                }
            } else {
                //alert('请求失败')
            }
        },
        /**
         * 浏览器支持原生获取地理位置经纬度时的回调
         * @param  {[type]}   error     [获取不到地理位置或者没有开启定位]
         * */
        errorFn: function (error) {
            if (window.localStorage.getItem('hotHome')) {
                getLocation.addLocationHome('hotHome');
            } else {
                getLocation.readAddHome();
            }
        },
        //获取附近小区
        getNearByHome: function () {
            if (window.navigator.geolocation) {//浏览器是否支持获取经纬度H5自带;
                window.navigator.geolocation.getCurrentPosition(getLocation.successFn, getLocation.errorFn, {timeout: 1000});
                //alert('支持')
            } else {//若不支持获取，先取本地缓存的热门小区
                //alert('不支持')
                if (window.localStorage.getItem('hotHome')) {
                    getLocation.addLocationHome('hotHome');
                } else {//如果没有缓存，重新请求
                    //alert('请求')
                    getLocation.readAddHome();
                }
            }
        }
    };
    getLocation.getNearByHome();//获取定位小区,初始运行
})(window, Zepto);