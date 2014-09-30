var Twit = require('twit');
var Q    = require('q');
var T = new Twit({
    consumer_key:         'lAtb5CrTy2m4cDA4MXxJUSiIW'
  , consumer_secret:      'Khgh1YYdSJ5rDsh9CFAReUhgpd4rgB09iGYZHTG6B0bw0k85LX'
  , access_token:         '184491874-E6BanL97qqg41k8A4OOhlgYE8eSGglSCDw9V4mF3'
  , access_token_secret:  'VuJnZdJHqnVxhqrO6PtE14BK1G1rlYqmgLouefjLqDTW6'
});
exports.reformatHash = function(original_hash)
{
  var new_hash = original_hash;
  if(new_hash && new_hash.length>0){
      if(new_hash.indexOf("#")>-1)
        {
          new_hash = new_hash.substr(new_hash.indexOf("#")+1);
        }
      new_hash=new_hash.toLowerCase();
  }
  return new_hash;
}
exports.search=function( cnt , hashtag  )
{
   var deferred = Q.defer();
    T.get('search/tweets', { q:  hashtag , count: cnt }, function(err, data, response) {
       
        console.log('twitter search --> pushed data '+hashtag);
        
        deferred.resolve(data);
    });
    return  deferred.promise;
}
exports.transform_tweets=function(hashtags,tweet)
{
  
  var json_obj = {};
  var media_array=[];
  var used_hashtags =[];
  
  var deferred = Q.defer(); 
  
  if(tweet)
  { 
      json_obj.gen_url="https://twitter.com/"+tweet.user.screen_name+"/status/"+tweet.id_str ;
      json_obj.created_at=tweet.created_at;
      json_obj.screen_name=tweet.user.screen_name;
      json_obj.name=tweet.user.name;
      json_obj.user_id=tweet.user.id;
      json_obj.user_id_str = tweet.user.id_str;
      json_obj.media=media_array;  
      json_obj.text_str=tweet.text;   
      json_obj.id=tweet.id;
      json_obj.id_str=tweet.id_str;
      json_obj.hashtags = used_hashtags;
      json_obj.type='twitter.search';
      json_obj.media=media_array;
       if( tweet.entities.media )
       {
          tweet.entities.media.forEach(function(media_item){
                  var media_item_={};
                  media_item_.social_url=media_item.url;
                  media_item_.image_url=media_item.media_url;
                  media_item_.image_url_https=media_item.media_url_https; 
                if(media_item.sizes)
                {
                       if(media_item.sizes.small)
                         {
                           media_item_.small_image_url=media_item.media_url+":small";
                           media_item_.small_image_url_https=media_item.media_url_https+":small";
                           media_item_.small_image_width=media_item.sizes.small.w;
                           media_item_.small_image_height=media_item.sizes.small.h;
                         }
                        if(media_item.sizes.medium)
                         {
                           media_item_.medium_image_url=media_item.media_url+":medium";
                           media_item_.medium_image_url_https=media_item.media_url_https+":medium";
                           media_item_.medium_image_width=media_item.sizes.medium.w;
                           media_item_.medium_image_height=media_item.sizes.medium.h;
                         }
                        if(media_item.sizes.medium)
                         {
                           media_item_.large_image_url=media_item.media_url+":large";
                           media_item_.large_image_url_https=media_item.media_url_https+":large";
                           media_item_.large_image_width=media_item.sizes.large.w;
                           media_item_.large_image_height=media_item.sizes.large.h;
                         }
                        if(media_item.sizes.thumb)
                         {
                           media_item_.thumb_image_url=media_item.media_url+":thumb";
                           media_item_.thumb_image_url_https=media_item.media_url_https+":thumb";
                           media_item_.thumb_image_width=media_item.sizes.thumb.w;
                           media_item_.thumb_image_height=media_item.sizes.thumb.h;
                         }                  
                } 
                 json_obj.media.push(media_item_);
          });
         if(tweet.entities.hashtags)
           {
             tweet.entities.hashtags.forEach(function(hashtag){ 
             
               var reformatted_hash = exports.reformatHash(hashtag.text);
                
               if(reformatted_hash && reformatted_hash.length >0)
                 { 
                    json_obj.hashtags.push(  reformatted_hash );
                   
                 }
                
             });
           }
       }
      deferred.resolve(json_obj);
  }
  else
  {
    console.log("transform_tweets - > No tweet found.") ;   
  }
  return deferred.promise;
}
exports.search_multiple=function(cnt, hashtags)
{
  var deferred = Q.defer();//promise to return all data.
  if(hashtags)
    {
      var queue_of_tasks = [];
      var queue_of_parse_tasks = [];
      hashtags.forEach(function(hashtag)
      {
        queue_of_tasks.push(  exports.search( cnt,hashtag ));               
      });
  
      Q.all(queue_of_tasks).then(function(ful){ 
          if(ful)
          {
  
            ful.forEach(function(tweet){
              if(tweet.statuses)
                { 
                      tweet.statuses.forEach(function(status){ 
                         queue_of_parse_tasks.push(  exports.transform_tweets(hashtags,status)  );
                      }); 
                      Q.all(queue_of_parse_tasks).then(function(ful_data){ 
                           
                          deferred.resolve(ful_data);
                      });
                } 
            });
          } 
          else
          {
            console.log("Twitter : Must expand to search mongo.");
          }
      });
    }
    else
    {
      console.log('no hashtags found.');  
    }
    return deferred.promise;
}