#!/usr/bin/python  
# -*- coding: utf-8 -*- 
import requests
import json
import redis
import time
import re

urltemplate = u"https://api.weibo.com/2/statuses/public_timeline.json?access_token=2.00DK3YxCDfSIcC2286323f71xxun5D&count=200"
redi = redis.StrictRedis(host='localhost', port=6379, db=0)

count = 0
hasNext = True
def find():
    global count
    r = requests.get(urltemplate)
    resp_dict = json.loads(r.content)
    if resp_dict['total_number'] == 0:
        time.sleep(3)
        return True
    for info in resp_dict['statuses']:
        image = info.get('original_pic')
        if image == None or u'http://' in info['text']:
            continue
        if u'iPhone' in info['source'] or u'Android' in info['source'] or u'手机' in info['source'] or u'Weico' in info['source']:
            if redi.exists(info['id']):
                continue
            count += 1
            source = re.sub(r'<[^<>]*>', '', info['source'])
            images = []
            for img in info['pic_urls']:
                images.append(img['thumbnail_pic'])
            text = re.sub(r'<[^<>]*>|#[^#]*#|@[^\s]+|\[[^\[\]]*\]', '', info['text'])
            timestamp = time.mktime(time.strptime(info['created_at'], '%a %b %d %H:%M:%S +0800 %Y'))
            print text
            #print source
            #print images
            #print timestamp
            #print info['user']['location']
            redi.hset(info['id'], 'from', source)
            redi.hset(info['id'], 'source', 'sina')
            redi.hset(info['id'], 'image', images)
            redi.hset(info['id'], 'text', text)
            redi.hset(info['id'], 'timestamp', int(timestamp))
            redi.hset(info['id'], 'location', info['user']['location'])
            redi.lpush('newtweet', info['id'])
    return resp_dict['total_number'] > 0

while count < 1000 and hasNext:
    hasNext = find()
