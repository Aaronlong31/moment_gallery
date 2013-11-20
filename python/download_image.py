import redis
import time
import urllib2
from PIL import Image
import os

redi = redis.StrictRedis(host='localhost', port=6379, db=0)

def process():
    lastHasResult = True
    while True:
        infoId = redi.rpop('newtweet')
        if infoId == None:
            if lastHasResult:
                print "No new tweet, waiting..."
            lastHasResult = False
            time.sleep(5)
            continue
        lastHasResult = True
        images = eval(redi.hget(infoId, 'image'))
        validImagesCount = 0
        for index, image in enumerate(images):
            tweetId_imageIndex = "%s_%d" % (infoId, index)
            file_name = tweetId_imageIndex + ".jpg"
            source = redi.hget(infoId, 'source')
            if source == 'sina':
                bigimage = image.replace('thumbnail','large')
            else:
                bigimage = image + "/2000"
            u = urllib2.urlopen(bigimage)
            f = open('images/' + file_name, 'wb')
            #meta = u.info()
            #file_size = int(meta.getheaders('Content-Length')[0])
            file_size_dl = 0
            block_sz = 8192
            while True:
                buffer = u.read(block_sz)
                if not buffer:
                    break

                file_size_dl += len(buffer)
                f.write(buffer)

            f.close()
            im = Image.open('images/' + file_name)
            if im.size[0] < 640 or im.size[1] < 480 or im.size[0]/im.size[1] > 2 or im.size[1]/im.size[0] > 2:
                os.remove('images/' + file_name)
                images[index] = None
            else:
                validImagesCount += 1
                redi.sadd("downloaded_image_tweet", tweetId_imageIndex)
                redi.hset("image_url", tweetId_imageIndex, image)
                print "Download " + file_name

        if validImagesCount == 0:
            redi.delete(infoId)

process()
