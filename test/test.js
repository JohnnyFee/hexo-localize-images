/*global describe, it */
'use strict';
var assert = require('assert');
var localImage = require('../');

describe('local image unit', function () {
    it('locale', function (done) {
        localImage.locale(done);
    });

    it('process file', function (done) {
        localImage.processArticle('2018-8-7-a-comprehensive-guide-for-buying-the-best-leather.md', done);
    });

    it('download image', function (done) {
        localImage.downloadImage({
            url: 'http://johnnyimages.qiniudn.com/1398314844css-box-model_collapsing-margins.png'
        }, done);
    });

    it('download image https', function (done) {
        localImage.downloadImage({
            url: 'https://jingsourcing.com/wp-content/uploads/2018/08/yiwumap1.jpg'
        }, done);
    });


});
