// call the packages we need
var express    = require('express'); 		// call express
var app        = express(); 				// define our app using express
var ntwitter = require('ntwitter');
var bodyParser = require('body-parser');
var Q =          require('q');
var s_twitter = require('./s_twitter');

//application context to use in this application
var application_context='/theposters';
//port to bind to for this application
var port = process.env.PORT || 8080; 		// set our port

 

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
 
findHashesInRequestCount= function(requested_hashes, response_hashes)
{
   var deferred = Q.defer();
  var count_ = 0;
  if(requested_hashes && response_hashes && requested_hashes.length> 0 && response_hashes.length > 0 )
   {
     console.log("Requested :"+requested_hashes);
     console.log("Responses :"+response_hashes);
 
     requested_hashes.forEach(function(hash){
       var index_=searchStringInArray(hash,response_hashes).then(function(index_){
           console.log("Index is "+index_+" for "+hash+"  "+ response_hashes);
           if(index_>-1)
           {
             count_++;
           }
       }) ;
       
     }); 
   }
  deferred.resolve(count_);
  return deferred.promise; 
}
searchStringInArray=function(str, strArray) {
   var deferred = Q.defer();
    for (var j=0; j<strArray.length; j++) {
      if (strArray[j].match(str)) {
        console.log("match "+str+" in "+strArray);
        deferred.resolve(j);
        return j;
      }
    }
    deferred.resolve(-1);
    console.log("No match "+str+"- "+strArray);
    return deferred.promise;
}
app.use(bodyParser.json());
rank = function(conf_obj)
{
  var data=conf_obj.data;
  var date_sort_asc = conf_obj.date_sort_asc;
  var rank_sort_asc = conf_obj.rank_sort_asc;
  var hashtag_array = conf_obj.hashtags;
   console.log("hashtag array "+hashtag_array);
   var deferred = Q.defer();//promise to return all data.

   data.sort(function(tweet1,tweet2){
                                  var d1 = new Date(tweet1.created_at);
                                  var d2 = new Date(tweet2.created_at);
                                 if(date_sort_asc)
                                 {
                                     return d1-d2;
                                 } 
                                 return d2-d1;
                            });
  var  LOAD_WEIGHT_HASHTAG = 1000;
  var LOAD_WEIGHT_MEDIA= 10000000000;
  var LOAD_WEIGHT_TEXT=  100000000;
  var rank_value_date=data.length;
  console.log("-----------------------------------------------");
  console.log(JSON.stringify(data));
  console.log("-----------------------------------------------");
  
  data.forEach(function(tweet){
        tweet.ranking =rank_value_date;
        if(tweet.text_str)
        {   
            tweet.ranking=tweet.ranking+LOAD_WEIGHT_TEXT;    
        }
        if(tweet.media)
        {  
           tweet.ranking=tweet.ranking+(LOAD_WEIGHT_MEDIA*tweet.media.length );
        }
        if(tweet.hashtags)
        {  
            
                   tweet.ranking=tweet.ranking+(LOAD_WEIGHT_HASHTAG*tweet.hashtags.length);    
            
          
        } 
        rank_value_date--;
  });
  data.sort(function(t1,t2){
      if(rank_sort_asc)
      {
              return t1.ranking-t2.ranking;
      }
      return t2.ranking-t1.ranking;
  });
  deferred.resolve(data);
  return deferred.promise;
}

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); 				// get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.json({ message: ' welcome to '+application_context+' root api!' });	
});

router.get('/socialmedia/:hashes', function(req,res){
//   res.json({message:'twitter default message'});
  console.log(application_context+'/socialmedia'); 
  var date_sort_asc_=false;
  var rank_sort_asc_=false;
  
  var mod_hashtags=[];
  var hashes_ =[];
  if(req.params.hashes){
      
      hashes_ = req.params.hashes.split(",");
    hashes_.forEach(function(hash){
        console.log("twitter search hash is "+hash); 
      var reformatted_=s_twitter.reformatHash(hash);
        console.log("Reformatted Hash is "+reformatted_);
        mod_hashtags.push(reformatted_);
    }); 
     s_twitter.search_multiple(  100 , hashes_  ).then(function(data){
       
       var conf_obj = {data: data , date_sort_asc: date_sort_asc_,  hashtags: mod_hashtags, rank_sort_asc: rank_sort_asc_};
       rank(conf_obj).then(function(data_ranked){
         console.log("twitter -- Data returned ranked data --> "+JSON.stringify(data_ranked));
         res.json(data_ranked);
       });
       
     })  ; 
  }
  else {
      console.log('no hashes found.');
    }
 
//s_twitter search hashtag here

});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use(application_context, router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('The Posters Listening on port --> ' + port+ '  application context '+application_context);