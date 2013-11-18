import redis
import time
import os

redi = redis.StrictRedis(host='localhost', port=6379, db=0)

def process():
    lastHasResult = True
    while True:
        infoId = redi.spop('deleted_tweet')
        if infoId == None:
            if lastHasResult:
                print "No need delete, waiting..."
                lastHasResult = False
            time.sleep(5)
            continue
        lastHasResult = True
        fileName = 'images/' + infoId + '.jpg'
        print "Delete image " + fileName
        if os.path.exists(fileName):
            os.remove(fileName)
        redi.srem('dtid', infoId)

process()

