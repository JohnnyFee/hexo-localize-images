'use strict';

const glob = require('glob');
const fs = require('fs');
const _ = require('lodash');
const download = require('./download');
const async = require('async');
const path = require('path');
const util = require('util');
const url = require('url');

let options = {
    sourceFolder: path.join(process.cwd(), 'source/_posts'),
    errorFile: path.join(process.cwd(), './unresolved.md'),
    imageFolder: path.join(process.cwd(), 'source/resources/images')
};

/**
 * 下载文章中的图片，并将图片地址替换为七牛的地址。
 *
 * @param options
 * @param cb
 * @param options.source
 * @param options.unresolved
 * @param options.dest
 *
 */
exports.locale = function (cb) {
    fs.writeFileSync(options.errorFile, "");

    async.waterfall([function (callback) {
        // 递归所有 markdown 文件
        glob(path.join(options.sourceFolder, '*.md'), callback);
    }, function (files, callback) {
        // 替换每个文件中的 URL
        async.each(files, exports.processArticle, callback);
    }], function (error) {
        console.log('done.');

        let content = fs.readFileSync(options.errorFile, {encoding: 'utf-8'});
        if (content) {
            console.log("Error downloading file list: ");
            console.log(content);
        }
        cb(error);
    });
};

exports.processArticle = function (filePath, callback) {
    console.log('Process ' + path.basename(filePath) + ' ...');

    let downloadingImages = updateContentAndExtractImages(filePath);
    async.each(downloadingImages, exports.downloadImage, callback);
};

function extractImageFileName(imageUrl) {
    let fileName = url.parse(imageUrl).pathname;

    return fileName.substr(fileName.lastIndexOf('/') + 1);
}


// 下载和替换文件中的图片
exports.downloadImage = function (img, callback) {
    // 异步下载图片。
    if (fs.existsSync(path.join(options.imageFolder, extractImageFileName(img.url)))) {
        return callback();
    }

    download(img.url, {directory: options.imageFolder}, function (err) {
        if (err) {
            console.error(err);
            fs.appendFileSync(options.errorFile, img.url + require('os').EOL);
            return callback();
        }

        // 文件处理完成
        callback();
    });
};

// 下载和替换文件中的图片
function updateContentAndExtractImages(filePath) {
    if (!path.isAbsolute(filePath)) {
        filePath = path.join(options.sourceFolder, filePath);
    }

    let content = fs.readFileSync(filePath, {encoding: 'utf-8'});

    // 一篇文档中待下载的图片路径列表
    let downloadingImages = [];

    let newContent = content.replace(/!\[(.*?)\]\((.*?)(\s+".*?")?\)/g, function (matched, imgAlt, imgSrc, title, offset, examined) {
        if (imgSrc.startsWith('../') || imgSrc.includes('csdn.net') || imgSrc.includes('qiniudn.com')) {
            return matched;
        }

        let imageName = extractImageFileName(imgSrc);
        title = title ? title : '';
        let img = {
            title: title,
            alt: imgAlt,
            url: imgSrc
        };

        downloadingImages.push(img);
        return util.format('![%s](../resources/images/%s %s)', imgAlt, imageName, title);
    });

    fs.writeFileSync(filePath, newContent);

    return downloadingImages;
}