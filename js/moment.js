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
    var webdisBaseUrl = "http://" + host + ":7379";
    var imageBaseUrl = "http://" + host + "/image/moment"
    // Load demo images from webdis:
    var carouselLinks = [];
    var linksContainer = $('#links');

    var start = 0;
    var pageSize = 105;
    var pageNo = 1;
    var tweetIds;
    var tweetSourceKey = "downloaded_image_tweet";
    function getDptids(page) {
        pageNo = Math.max(1, page);
        var start = (pageNo - 1) * pageSize;
        carouselLinks = [];
        linksContainer.html("");
        $.ajax({
            url: webdisBaseUrl + "/SORT/" + tweetSourceKey + "/ALPHA/LIMIT/" + start + "/" + pageSize,
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
            (function(tweetId_iIndex){
                var aa = tweetId_iIndex.split("_");
                var tweetId = aa[0];
                var iIndex = aa[1];
                $.ajax({
                    url: webdisBaseUrl + "/HGETALL/" + tweetId,
                    success : function(data) {
                        var tweet = data.HGETALL;
                        var title = formatTimestamp(tweet.timestamp) + " " + tweet.location + " \"" + tweet.text + "\"";
                        $.get(webdisBaseUrl + "/HGET/image_url/" + tweetId_iIndex).done(function(result){
                            var imageUrl = result.HGET;
                            var localUrl = imageBaseUrl + "/" + tweetId_iIndex + ".jpg"
                            $('<a/>')
                                .append($('<img>').prop('src', imageUrl + "/160"))
                                .prop('href', localUrl)
                                .attr("tid", tweetId)
                                .attr("iid", iIndex)
                                .prop('title', title)
                                .attr('data-gallery', '')
                                .appendTo(linksContainer);
                            carouselLinks.push({
                                href: localUrl,
                                title: title
                            });
                        });
                    }
                });
            })(ids[i]);
        }
    }
    var galleryIsOpen = false;
    $('#blueimp-gallery').on('slide', function (event, index, slide) {
        $("#accept").attr("index", index);
        $("#delete").attr("index", index);
    }).on('open', function(){
        galleryIsOpen = true;
    }).on('close', function(){
        galleryIsOpen = false;
    });
    $(document).on("keypress", function(event){
        if (galleryIsOpen) {
            switch(event.which) {
                case 97://a
                    process($("#accept").attr("index"), true);
                    break;
                case 100://d
                    process($("#delete").attr("index"), false);
                    break;
                case 110://n
                    $('#blueimp-gallery').data('gallery').next();
                    break;
                case 112://p
                    $('#blueimp-gallery').data('gallery').prev();
                    break;
                default:
                    console.log("keypress: " + event.which);
            }
        } else {
            switch(event.which){
                case 110://n
                    getDptids(pageNo+1);
                    break;
                case 112://p
                    getDptids(pageNo-1);
                    break;
                case 114://r
                    getDptids(pageNo);
                    break;
                default:
                    console.log("keypress: " + event.which);
            }
        }
    });

    $(document).on('click', "#accept", function(event){
        var index = $(this).attr("index");
        process(index, true);
    });

    $(document).on('click', "#delete", function(event){
        var index = $(this).attr("index");
        process(index, false);
    });

    function process(index, isAccept) {
        var tid = $('#links a').eq(index).attr("tid");
        var iid = $('#links a').eq(index).attr("iid");
        var gotoKey = isAccept ? "accepted_tweet" : "deleted_tweet";
        $.get(webdisBaseUrl + "/SREM/" + tweetSourceKey + "/" + tid + "_" + iid).done(function(result){
            $.get(webdisBaseUrl + "/SADD/" + gotoKey + "/" + tid + "_" + iid);
        });
        var gallery = $('#blueimp-gallery').data('gallery');
        gallery.next();
    }

    function formatTimestamp(timestamp) {
        return new Date(parseInt(timestamp) * 1000).toLocaleString().replace(/年|月/g, "-").replace(/日/g, " ");
    }

    $("#Pre").click(function(){
        getDptids(pageNo-1);
    });
    $("#Next").click(function(){
        getDptids(pageNo+1);
    });
    $(".source").change(function(){
        tweetSourceKey = this.value;
        getDptids(1);
    });

    getDptids(1);
});
