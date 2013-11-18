import requests
import json
import redis
import time

urltemplate = u"http://open.t.qq.com/api/statuses/public_timeline?pos={0}&reqnum=100&pageflag=0&format=json&access_token=82976016397fd2d0eab4deb74333e0b7&oauth_consumer_key=801058005&openid=506BC4A8346A20A34C4D469A5BD30389&oauth_version=2.a&clientip=116.228.187.90&scope=all&appfrom=php-sdk2.0beta&seqid=1384398531&serverip=183.60.10.172"
redi = redis.StrictRedis(host='localhost', port=6379, db=0)

count = 0
hasNext = True
pos = 0
def find():
    global pos
    global count
    r = requests.get(urltemplate.format(pos))
    resp_dict = json.loads(r.content)
    if resp_dict['msg'] == u'have no tweet':
        pos = 0
        time.sleep(3)
        return True
    pos = resp_dict['data']['pos']
    for info in resp_dict['data']['info']:
        if info['isvip'] == 1 or info['type'] != 1 or info['count'] > 10 or info['image'] == None or u'http://' in info['text']:
            continue
        if info['from'].startswith('iPhone') or info['from'].startswith('Android'):
            if redi.exists(info['id']):
                continue
            count += 1
            redi.hset(info['id'], 'from', info['from'])
            redi.hset(info['id'], 'image', info['image'])
            redi.hset(info['id'], 'text', info['text'])
            redi.hset(info['id'], 'timestamp', info['timestamp'])
            redi.hset(info['id'], 'location', info['location'])
            redi.lpush('newtweet', info['id'])
    return resp_dict['data']['hasnext'] == 0

while count < 1000 and hasNext:
    hasNext = find()
