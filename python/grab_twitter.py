from twitter import *
import os
import time
CONSUMER_SECRET = 'LJYDjDMhBhEP6iSD3wjMsZ5pPKiKQaO5RJpjVSvfqw'
CONSUMER_KEY = 'mLhn1kUn9ATQIL78PHUbUg'
MY_TWITTER_CREDS = os.path.expanduser('~/.moment_twitter_credentials')
if not os.path.exists(MY_TWITTER_CREDS):
    oauth_dance("Moment Gallery", CONSUMER_KEY, CONSUMER_SECRET, MY_TWITTER_CREDS)

oauth_token, oauth_secret = read_token_file(MY_TWITTER_CREDS)

twitter_stream = TwitterStream(auth=OAuth(
    oauth_token, oauth_secret, CONSUMER_KEY, CONSUMER_SECRET))

iterator = twitter_stream.statuses.sample()
for tweet in iterator:
    print tweet
    time.sleep(5)
