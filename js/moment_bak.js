/*
 * blueimp Gallery Demo JS 2.10.0
 * https://github.com/blueimp/Gallery
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint unparam: true */
/*global window, document, blueimp, $ */

$(function () {
    'use strict';

    var host = window.location.hostname;
    var webdisBaseUrl = "http://" + host + ":7379/";
    var imageBaseUrl = "http://" + host + "/image/moment/"
    // Load demo images from webdis:
    var carouselLinks = [];
    var linksContainer = $('#links');

    var start = 0;
    var pageSize = 100;
    var pageNo = 1;
    var tweetIds;
    function getDptids(page) {
        pageNo = Math.max(1, page);
        console.log(pageNo);
        var start = (pageNo - 1) * pageSize;
        $.ajax({
            url: webdisBaseUrl + "SORT/dptid/LIMIT/" + start + "/" + pageSize,
            success: function(data) {
                if (data.SORT.length == 0) {
                    pageNo--;
                } else {
                    getTweets(data.SORT);
                }
            }
        });
    }

    function getTweets(ids) {
        for (var i in ids) {
            (function(index){
                $.ajax({
                    url: webdisBaseUrl + "HGETALL/" + ids[index],
                    success : function(data) {
                        var tweet = data.HGETALL;
                        var images = stringToArray(tweet.aimage);
                        var title = formatTimestamp(tweet.timestamp) + " " + tweet.location + " \"" + tweet.text + "\"";
                        for (var j in images) {
                            var imageUrl = images[j];
                            if (imageUrl == null) {
                                continue;
                            }
                            var url = imageBaseUrl + ids[index] + "_" + j + ".jpg";
                            $('<a/>')
                            .append($('<img>').prop('src', imageUrl + "/160"))
                            .prop('href', url)
                            .attr("tid", ids[index])
                            .attr("iid", j)
                            .prop('title', title)
                            .attr('data-gallery', '')
                            .appendTo(linksContainer);
                            carouselLinks.push({
                                href: url,
                                title: title
                            });
                        }
                    }
                });
            })(i);
        }
    }
    $('#blueimp-gallery').on('slide', function (event, index, slide) {
        $(slide).append($("<button>").text("Accept")
                        .attr("index", index).attr("type", "button")
                        .addClass("accept_button btn btn-success btn-lg glyphicon glyphicon-ok"));
        $(slide).append($("<button>").text("Delete")
                        .attr("index", index).attr("type", "button")
                        .addClass("delete_button btn btn-danger btn-lg glyphicon glyphicon-remove"));
    });

    $(document).on('click', ".accept_button", function(event){
        var index = $(this).attr("index");
        console.log("accept: " + index);
        var tid = $('#links a').eq(index).attr("tid");
        var iid = $('#links a').eq(index).attr("iid");
        console.log(tid + ":" + iid);
        $.get(webdisBaseUrl + "SADD/atid/" + tid + "_" + iid);
        $.ajax({
            url: webdisBaseUrl + "HGET/" + tid + "/image",
            success: function(data) {
                var images = stringToArray(data.HGET);
                delete images[iid];
                var needDelete = true;
                for (var k in images) {
                    if(images[k] != null || images[k] == '') {
                        needDelete = false;
                        break;
                    }
                }
                if (needDelete) {
                    $.get(webdisBaseUrl + "SREM/dptid/" + tid);
                }
                var imagesString = JSON.stringify(images).replace(/"/g, "'");
                imagesString = encodeURIComponent(imagesString);
                var url = webdisBaseUrl + "HSET/" + tid + "/image/" + imagesString;
                $.get(url).done(function(result){
                    console.log(result);
                });
                $.get(webdisBaseUrl + "HGET/" + tid + "/aimage").done(function(result){
                    var aimages = stringToArray(result.HGET);
                    if (aimages == null) {
                        aimages = new Array(images.length);
                    }
                    aimages[iid] = images[iid];
                    var aimagesString = JSON.stringify(aimages).replace(/"/g, "'");
                    aimagesString = encodeURIComponent(aimagesString);
                    $.get(webdisBaseUrl + "HSET/" + tid + "/aimage/" + aimagesString);
                });
            }
        });
        var gallery = $('#blueimp-gallery').data('gallery');
        gallery.next();
        event.stopPropagation();
        return false;
    });

    function stringToArray(str) {
        if(!str) {
            return null;
        }
        return eval(str.replace(/u'/g, "'"));
    }
    $(document).on('click', ".delete_button", function(event){
        var index = $(this).attr("index");
        console.log("delete: " + index);
        var tid = $('#links a').eq(index).attr("tid");
        var iid = $('#links a').eq(index).attr("iid");
        //$("#links a").eq(index).remove();
        console.log(tid + ":" + iid);
        $.ajax({
            url: webdisBaseUrl + "HGET/" + tid + "/image",
            success: function(data) {
                var images = stringToArray(data.HGET);
                delete images[iid];
                var needDelete = true;
                for (var k in images) {
                    if(images[k] != null || images[k] == '') {
                        needDelete = false;
                        break;
                    }
                }
                if (needDelete) {
                    $.get(webdisBaseUrl + "SREM/dptid/" + tid);
                }
                $.get(webdisBaseUrl + "SADD/dtid/" + tid + "_" + iid);
                var imagesString = JSON.stringify(images).replace(/"/g, "'");
                imagesString = encodeURIComponent(imagesString);
                var url = webdisBaseUrl + "HSET/" + tid + "/image/" + imagesString;
                console.log(url);
                $.get(url).done(function(result){
                    console.log(result);
                });
            }
        });
        var gallery = $('#blueimp-gallery').data('gallery');
        gallery.next();
        event.stopPropagation();
        return false;
    });

    function formatTimestamp(timestamp) {
        return new Date(parseInt(timestamp) * 1000).toLocaleString().replace(/年|月/g, "-").replace(/日/g, " ");
    }

    $("#More").click(function(){
        getDptids(pageNo+1);
    })

    getDptids(1);
});
