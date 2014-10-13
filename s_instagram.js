var ig = require('instagram-node').instagram();
var Q    = require('q');
ig.use({ access_token: '582742177.5b48709.62afa5bc923d4a638279fbdb39ef9575' });
ig.use({ client_id: '5b48709500c443c7bcfa190149322a70',
         client_secret: 'e46d5f7f32fd4a85a85b4a13cbd67ce6' });
exports.reformatHashIg = function(original_hash)
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
exports.search_ig=function( cnt , hashtag  )
{
  
  var reformatted_hashtag_  = exports.reformatHashIg(hashtag);
  
   var deferred = Q.defer();
    ig.tag_media_recent(reformatted_hashtag_, function(err, medias, pagination, remaining, limit) { 
      console.log("IG:"+err);
      console.log("RESULT:"+JSON.stringify(medias));
      console.log("PAGINATION:"+JSON.stringify(pagination));
      console.log("REMAINING:"+remaining);
      console.log("LIMIT:"+limit);
      deferred.resolve(medias);
    });
//     T.get('search/tweets', { q:  hashtag , count: cnt }, function(err, data, response) {
       
//         console.log('search --> pushed data '+hashtag);
        
//         deferred.resolve(data);
//     });
    return  deferred.promise;
}
exports.transform_ig=function(hashtags,post)
{
   
  var json_obj = {};
  var media_array=[];
  var used_hashtags =[];
  
  var deferred = Q.defer(); 
  
  if(post)
  {   
       
           json_obj.gen_url= post.link; 
          if(post.created_time)
          {
              json_obj.created_at=new Date(post.created_time*1000);
          }
          json_obj.media=media_array;  
          json_obj.type='instagram.search'; 
          if(post.user)
          { 
              json_obj.screen_name=post.user.username;
              json_obj.name=post.user.full_name;
              json_obj.user_id=post.user.id;
              json_obj.user_id_str = ""+post.user.id;

          } 
          if(post.caption)
          {  
               json_obj.text_str=post.caption.text; 
               json_obj.id=post.caption.id;
               json_obj.id_str=""+post.id;
          }
          json_obj.hashtags = used_hashtags;
          json_obj.media=media_array;
        if(post.tags)
         {    
           post.tags.forEach(function(tag_){
               json_obj.hashtags.push(tag_);
           });
                            
          }    
          if(post.images)
          { 
                  var media_item_={};
                  media_item_.social_url=post.link;
                  media_item_.image_url=post.images.low_resolution.url; 
                         if(post.images.low_resolution)
                         {
                           media_item_.small_image_url=post.images.low_resolution.url;
                           media_item_.small_image_width=post.images.low_resolution.width;
                           media_item_.small_image_height=post.images.low_resolution.height;
                         }
                        if(post.images.standard_resolution)
                         {
                          
                           media_item_.large_image_url=post.images.standard_resolution.url;
                            media_item_.large_image_width=post.images.standard_resolution.width;
                           media_item_.large_image_height=post.images.standard_resolution.height;
                         }
                        if(post.images.thumbnail)
                         {
                            media_item_.thumb_image_url=post.images.thumbnail.url;
                            media_item_.thumb_image_width=post.images.thumbnail.width;
                           media_item_.thumb_image_height=post.images.thumbnail.height
                         } 
                          json_obj.media.push(media_item_);
           
                          
            } 
      deferred.resolve(json_obj);
  
    } 
  else
  {
    console.log("transform_ig - > No tweet found.") ;   
  }
  return deferred.promise;
}
exports.search_multiple_ig=function(cnt, hashtags)
{
  var deferred = Q.defer();//promise to return all data.
  if(hashtags)
    {
      var queue_of_tasks = [];
      var queue_of_parse_tasks = [];
      hashtags.forEach(function(hashtag)
      {
        console.log("Instagram Searching "+hashtag);
        queue_of_tasks.push(  exports.search_ig( cnt,hashtag ));               
      });
  
      Q.all(queue_of_tasks).then(function(ful){ 
          if(ful)
          {
   
            console.log("Instagram Fullfilled "+ful.length+" promises.");  
            ful.forEach(function(posts){
              if(posts)
                { 
                      posts.forEach(function(post){ 
                         queue_of_parse_tasks.push(  exports.transform_ig(hashtags,post)  );
                      }); 
                      Q.all(queue_of_parse_tasks).then(function(ful_data){ 
                           
                          deferred.resolve(ful_data);
                      });
                } 
            });
          } 
          else
          {
            console.log("Instagram::Must expand to search mongo.");
          }
      });
    }
    else
    {
      console.log('instagram no hashtags found.');  
    }
    return deferred.promise;
}
