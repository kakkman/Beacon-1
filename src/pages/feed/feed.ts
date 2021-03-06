import { Component } from '@angular/core';
import { Geolocation ,GeolocationOptions ,Geoposition ,PositionError } from '@ionic-native/geolocation'; 
import { IonicPage, NavController, NavParams, LoadingController, MenuController, AlertController, Events } from 'ionic-angular';

import { CreatePostPage } from '../create-post/create-post';
import {SearchPage} from '../search/search';
import {OrgApprovalPage} from '../org-approval/org-approval';

//import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { AngularFireList } from "angularfire2/database"; //apparently AngularFire has been outdated
import { Observable } from 'rxjs/Observable';
import { AuthProvider } from '../../providers/auth/auth';
import firebase from 'firebase';


/**
 * Generated class for the FeedPage page.
 * Created by Ryan Roe for Beacon Capstone Project
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-feed',
  templateUrl: 'feed.html',
})
export class FeedPage {

	itemsRef: AngularFireList<any>;
	items: Observable<any[]>;

	public postList:Array<any>; //Is for creating a database reference so we can pull the data from Firebase.
	public loadedPostList:Array<any>; //So we dont have to call data twice from firebase
	public postRef;//:firebase.database.Reference;//Is to store the list of posts we’re pulling from Firebase.
	//public loading:Loading;
	public postsToLoad: number = 10;
	public isOrganization = false;
	public isAdmin = false;
	public isTest = true;
	public isUser = true;
	public isApprovedOrg = false;
	public latitude;
	public longitude;
	options : GeolocationOptions;
	currentPos : Geoposition;
	//latitude: Number;
	//longitude : Number;


	constructor(public events: Events, public menuCtrl: MenuController, public navCtrl: NavController, public navParams: NavParams, 
		public authProvider: AuthProvider, public loadingCtrl: LoadingController, private alertCtrl: AlertController, private geolocation: Geolocation) { 

		this.menuCtrl.enable(true, 'navMenu');
		this.options = {
	    enableHighAccuracy : false,
	    timeout: 20000
	    };
	   	this.postRef = firebase.database().ref('/messages').orderByChild('timestamp');
	    this.geolocation.getCurrentPosition(this.options).then((pos : Geoposition) => {

	        this.currentPos = pos;
	        this.latitude = pos.coords.latitude;
	        this.longitude = pos.coords.longitude; 
 
	        console.log(pos);  
	        console.log("feed page constructor pos = " + this.currentPos);	        
		    this.postRef.limitToFirst(this.postsToLoad).once('value', postList => {
	          let posts = [];
	          postList.forEach( post => {
	          	if(this.latitude+.724 > post.val().latitude && this.latitude-.724 < post.val().latitude && this.longitude+.724 > post.val().longitude && this.longitude-.724 < post.val().longitude){
	            		posts.push(post.val());
	          	}//this filters the posts so that only posts within 50 miles longitude and 50 latitude are selected
	            return false;
	          });
	          this.postList = posts;
	          this.loadedPostList = posts;

			  if(posts.length == 0){
		    	let alert = this.alertCtrl.create({
			    title: 'No Posts',
			    subTitle: 'There are no posts within your area. We have limited the posts to 50 miles within your location.',
			    buttons: ['Dismiss']
			  });
			  alert.present();
		   	  }
        	});

	    },(err : PositionError)=>{
	        console.log("error : " + err.message);
	    ;
	    });
		var UID = firebase.auth().currentUser.uid;
    	var currentUserDB = firebase.database().ref('/userProfile/'+ UID);
    	currentUserDB.once('value', userInfo => {
        	var organization = userInfo.val().organization;
        	var approvedOrg = userInfo.val().approved;
        	var admin = userInfo.val().email;
        	if(organization != null )
	    	{
	       		this.isOrganization = true;
	       		this.isUser = false;
	    	}
	    	if(approvedOrg == "approved"){
	    		this.isApprovedOrg = true;
	    		this.isOrganization = false;
	    	}
	    	if(admin == "ryanroe559@gmail.com" || admin == "amandamb@email.sc.edu")
	    	{
	       		this.isAdmin = true;
	    	}
	    });
	    
	    this.events.subscribe('user_posted', (post) => {
	    	this.doRefresh(null);
	    })

  	}


  	ionViewDidLoad() {
  	 	console.log('ionViewDidLoad FeedPage');
  		 //this.doRefresh(null);
   	     //Search Constructor: pulls data from Firebase into postList array everytime the data changes	 
   	     this.menuCtrl.enable(true, 'navMenu');
  	}

  	ngOnInit() {
  		this.doRefresh(null);
  	}

	btnCreateClicked(){
		this.navCtrl.push(CreatePostPage);
	}

	btnSearchClicked(){
		this.navCtrl.push(SearchPage);
	}
	

	btnOrgClicked(){
		this.navCtrl.push(OrgApprovalPage);
	}

	btnCreateClickedFalse(){
		if(this.isOrganization == true){
		  let alert = this.alertCtrl.create({
		    title: 'Sorry!',
		    subTitle: 'Only approved organization profiles are able to create posts with Beacon. Please wait until we approve your account.',
		    buttons: ['Dismiss']
		  });
		  alert.present();
		}
		else {
		  let alert = this.alertCtrl.create({
		    title: 'Sorry!',
		    subTitle: 'User profiles are unable to create posts. This is designed to declutter the feed, and enable you to quickly find supplies and volunteer opportunities.',
		    buttons: ['Dismiss']
		  });
		  alert.present();
		}
	};

	doRefresh(refresher) {
	    console.log('Begin async operation');
	   	this.postRef.limitToFirst(this.postsToLoad).once('value', postList => { //value event is used to read a static snapshot of the contents at a given database path, as they existed at the time of the read event. It is triggered once with the initial data and again every time the data changes.
		 	let posts = [];  //store Firebase data temporarily
		  	postList.forEach( post => { 
		  		
		    	if(this.latitude+.724 > post.val().latitude && this.latitude-.724 < post.val().latitude && this.longitude+.724 > post.val().longitude && this.longitude-.724 < post.val().longitude){
            		posts.push(post.val());
          	}
	   	 		return false;

	 		});
	 		this.postList = posts;
	 		this.loadedPostList = posts;
	 		if(refresher != null)
	 		{
	 			refresher.complete();
	 		}
		});
	}

	loadMorePosts(scroll) {
        this.postsToLoad += 10; // or however many more you want to load
        this.postRef.limitToFirst(this.postsToLoad).once('value', postList => {
          let posts = [];
          postList.forEach( post => {
            if(this.latitude+.724 > post.val().latitude && this.latitude-.724 < post.val().latitude && this.longitude+.724 > post.val().longitude && this.longitude-.724 < post.val().longitude){
            		posts.push(post.val());
          	}
            return false;
          });

          this.postList = posts;
          this.loadedPostList = posts;
          if(scroll != null)
          {
          	scroll.complete();
          }  
        });
    }
    getUserPosition(){
	    this.geolocation.getCurrentPosition(this.options).then((pos : Geoposition) => {

	        this.currentPos = pos;
	        this.latitude = pos.coords.latitude;
	        this.longitude = pos.coords.longitude;    
	        console.log(pos);

	    },(err : PositionError)=>{
	        console.log("error : " + err.message);
	    ;
	    });
  	}

}

