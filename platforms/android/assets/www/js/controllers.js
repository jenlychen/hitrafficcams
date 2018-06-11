angular.module('starter.controllers', [])
.controller('MapCtrl', function($scope, $rootScope, $http, $ionicLoading, $ionicModal, $ionicSideMenuDelegate, alertServices) {
	$scope.$on('$ionicView.afterEnter', function() {
		ionic.trigger('resize');
		$ionicSideMenuDelegate.canDragContent(false);
	});
	
	// center map (honolulu)
	var latLng = new google.maps.LatLng(21.3069444, -157.8583333);
	
	// map style
	var mapStyle = [
	    {
	        "featureType": "water",
	        "elementType": "geometry.fill",
	        "stylers": [
	            {
	                "color": "#46bcec"
	            },
	            {
	                "visibility": "on"
	            }
	        ]
	    },
	    {
	        "featureType": "landscape",
	        "stylers": [
	            {
	                "color": "#f2f2f2"
	            }
	        ]
	    },
	    {
	        "featureType": "road",
	        "stylers": [
	            {
	                "saturation": -100
	            },
	            {
	                "lightness": 45
	            }
	        ]
	    },
	    {
	        "featureType": "road.highway",
	        "stylers": [
	            {
	                "visibility": "simplified"
	            }
	        ]
	    },
	    {
	        "featureType": "road.arterial",
	        "elementType": "labels.icon",
	        "stylers": [
	            {
	                "visibility": "off"
	            }
	        ]
	    },
	    {
	        "featureType": "administrative",
	        "elementType": "labels.text.fill",
	        "stylers": [
	            {
	                "color": "#444444"
	            }
	        ]
	    },
	    {
	        "featureType": "transit",
	        "stylers": [
	            {
	                "visibility": "off"
	            }
	        ]
	    },
	    {
	        "featureType": "poi",
	        "stylers": [
	            {
	                "visibility": "off"
	            }
	        ]
	    }
	];
	
	// map options
	var mapOptions = {
		center: latLng,
		zoom: 14,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		styles: mapStyle,
		disableDefaultUI: true
    };
    
    // make map
    $rootScope.map = new google.maps.Map(document.getElementById('mapContainer'), mapOptions);
    $rootScope.trafficLayer = new google.maps.TrafficLayer();
    
    if(localStorage.showTrafficOption === 'true') {
		$rootScope.trafficLayer.setMap($rootScope.map);
	}
	else {
		$rootScope.trafficLayer.setMap(null);
	}
	
	// function to get cameras from server or localhost
	function fetchCameras(callback) {
		// show loading modal
		if(!$rootScope.hasWarning) {
			$ionicLoading.show({
				template: '<span>Loading the spy cam... I mean traffic cameras...</span>',
			});
		}
		
		// check if cameras are in localstorage and was fetched recently
		if(!localStorage.cameras || !localStorage.fetchTime) {
			// get stations from server and put them in localstorage
			$http({method: 'GET', url: 'http://ai-no-kea.com/hitrafficcams/proxy/stations/'}).
			success(function(data) {
				if(localStorage.favorites) {
					var favorites = JSON.parse(localStorage.favorites);
										
					angular.forEach(favorites, function(fValue) {
						angular.forEach(data, function(dValue, dIndex) {
							if(fValue.deviceID === dValue.deviceID) {
								data[dIndex].isFav = true;
							}
						});
					});
				}
				
				localStorage.cameras = JSON.stringify(data);
				localStorage.fetchTime = new Date().valueOf();
				$ionicLoading.hide();
				return callback(true);
			}).
			// show error if cannot fetch stations
			error(function() {
				alertServices.makeAlert('Connection Error', 'Couldn\'t fetch cameras.  Most of them are broken anyway.', 'Dismiss', function(){});
				$ionicLoading.hide();
				return callback(false);
			});
		}
		// if cameras were fetched more than 7 days ago
		else if(localStorage.cameras && localStorage.fetchTime <= (new Date().valueOf() - 604800000)) {
			// get stations from server and put them in localstorage
			$http({method: 'GET', url: 'http://ai-no-kea.com/hitrafficcams/proxy/stations/'}).
			success(function(data) {
				if(localStorage.favorites) {
					var favorites = JSON.parse(localStorage.favorites);
										
					angular.forEach(favorites, function(fValue) {
						angular.forEach(data, function(dValue, dIndex) {
							if(fValue.deviceID === dValue.deviceID) {
								data[dIndex].isFav = true;
							}
						});
					});
				}
				
				localStorage.cameras = JSON.stringify(data);
				localStorage.fetchTime = new Date().valueOf();
				$ionicLoading.hide();
				return callback(true);
			}).
			// show error if cannot fetch stations
			error(function() {
				alertServices.makeAlert('Connection Error', 'Couldn\'t fetch cameras.  Maybe someone stole the copper.', 'Dismiss', function(){});
				$ionicLoading.hide();
				return callback(false);
			});	
		}
		// hide modal
		else {
			$ionicLoading.hide();
			return callback(true);
		}
	}
	
	// set up empty array for markers
	$rootScope.markers = [];
	
	// get the camera and make markers
	fetchCameras(function() {
		function markerClick(i) {
			google.maps.event.addListener(marker, 'click', function() {
				$scope.camera = $rootScope.cameras[i];
				
				var pan = (window.innerHeight - 300) / 2;
				$rootScope.map.setCenter(new google.maps.LatLng($rootScope.cameras[i].location.latitude, $rootScope.cameras[i].location.longitude));
				$rootScope.map.panBy(0, pan);
				
				$rootScope.modal.show();
			});
		}
		
		// pass cameras from localstorage to scope
		$rootScope.cameras = JSON.parse(localStorage.cameras);
		
		// make markers from camera geolocation
		for(var i = 0; i <  $rootScope.cameras.length; i++) {
			var markerPosition = new google.maps.LatLng($rootScope.cameras[i].location.latitude, $rootScope.cameras[i].location.longitude);
			
			var marker = new google.maps.Marker({
				position: markerPosition,
				map: $rootScope.map,
				icon: new google.maps.MarkerImage(
					($rootScope.cameras[i].isFav ? 'img/fav.png' : 'img/noFav.png'),
					null,
					null,
					null,
					new google.maps.Size(25, 34)
				),
				optimized: false
			});
			
			// create event when users tap marker
			markerClick(i);
			
			$rootScope.markers.push(marker);
		}
	});
	
	// make modal to show camera image
	$ionicModal.fromTemplateUrl('templates/cameraModal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$rootScope.modal = modal;
	});
	
	$scope.closeModal = function() {
		$rootScope.modal.hide();
		
		$scope.camera = null;
	};
	
	// function to add camera to favorites
	$scope.addToFavorites = function(camera) {
		$scope.favoriteAddCounter = 0;
		
		function markerClick(i) {
			google.maps.event.addListener(marker, 'click', function() {
				$scope.camera = $rootScope.cameras[i];
				
				var pan = (window.innerHeight - 300) / 2;
				$rootScope.map.setCenter(new google.maps.LatLng($rootScope.cameras[i].location.latitude, $rootScope.cameras[i].location.longitude));
				$rootScope.map.panBy(0, pan);
				
				$rootScope.modal.show();
			});
		}
		
		var favorites = [];
		var index = null;
		
		if(!localStorage.favorites) {
			index = $rootScope.cameras.indexOf(camera);
			
			$rootScope.cameras[index].isFav = true;
			
			localStorage.cameras = JSON.stringify($rootScope.cameras);
			
			camera.isFav = true;
			
			favorites.push(camera);
			
			localStorage.favorites = JSON.stringify(favorites);
			
			if($rootScope.favorites) {
				$rootScope.favorites = favorites;
			}
		}
		else {
			index = $rootScope.cameras.indexOf(camera);
			
			$rootScope.cameras[index].isFav = true;
			
			localStorage.cameras = JSON.stringify($rootScope.cameras);
			
			camera.isFav = true;
			
			favorites = JSON.parse(localStorage.favorites);
			
			favorites.push(camera);
			
			localStorage.favorites = JSON.stringify(favorites);
			
			if($rootScope.favorites) {
				$rootScope.favorites = favorites;
			}
		}
		
		$rootScope.markers.splice(index,1);
			
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng($rootScope.cameras[index].location.latitude, $rootScope.cameras[index].location.longitude),
			map: $rootScope.map,
			icon: new google.maps.MarkerImage(
				'img/fav.png',
				null,
				null,
				null,
				new google.maps.Size(25, 34)
			),
			optimized: false
		});
		
		markerClick(index);
	};
		
	// function to remove camera from favorites
	$scope.removeFromFavorites = function(camera) {		
		function markerClick(i) {
			google.maps.event.addListener(marker, 'click', function() {
				$scope.camera = $rootScope.cameras[i];
				
				var pan = (window.innerHeight - 300) / 2;
				$rootScope.map.setCenter(new google.maps.LatLng($rootScope.cameras[i].location.latitude, $rootScope.cameras[i].location.longitude));
				$rootScope.map.panBy(0, pan);
				
				$rootScope.modal.show();
			});
		}
		
		var favorites = JSON.parse(localStorage.favorites);
		var index = $rootScope.cameras.indexOf(camera);
		
		favorites.splice(favorites.indexOf(camera),1);
		
		localStorage.favorites = JSON.stringify(favorites);
		
		delete $rootScope.cameras[index].isFav;
		
		localStorage.cameras = JSON.stringify($rootScope.cameras);
		
		$rootScope.markers.splice(index,1);
			
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng($rootScope.cameras[index].location.latitude, $rootScope.cameras[index].location.longitude),
			map: $rootScope.map,
			icon: new google.maps.MarkerImage(
				'img/noFav.png',
				null,
				null,
				null,
				new google.maps.Size(25, 34)
			),
			optimized: false
		});
		
		markerClick(index);
		
		if($rootScope.favorites) {
			$rootScope.favorites = favorites;
		}
	};
})
.controller('FavoritesCtrl', function($scope, $rootScope) {
	if(!localStorage.favorites) {
		localStorage.favorites = JSON.stringify([]);
	}
	
	$rootScope.favorites = JSON.parse(localStorage.favorites);
	
	// function to remove camera from favorites
	$scope.removeFromFavorites = function(camera) {		
		var index = null;
		
		if(!$rootScope.cameras) {
			$rootScope.cameras = JSON.parse(localStorage.cameras);
		}
		
		angular.forEach($rootScope.cameras, function(cValue, cIndex) {
			if(cValue.deviceID === camera.deviceID) {
				index = cIndex;
			}
		});
		
		$rootScope.favorites.splice($rootScope.favorites.indexOf(camera),1);
		
		localStorage.favorites = JSON.stringify($rootScope.favorites);
		
		delete $rootScope.cameras[index].isFav;
		
		localStorage.cameras = JSON.stringify($rootScope.cameras);
		
		
			function markerClick(i, marker) {
				google.maps.event.addListener(marker, 'click', function() {
					$scope.camera = $rootScope.cameras[i];
					
					var pan = (window.innerHeight - 300) / 2;
					$rootScope.map.setCenter(new google.maps.LatLng($rootScope.cameras[i].location.latitude, $rootScope.cameras[i].location.longitude));
					$rootScope.map.panBy(0, pan);
					
					$rootScope.modal.show();
				});
			}
			
		if($rootScope.markers) {
			$rootScope.markers.splice(index,1);
				
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng($rootScope.cameras[index].location.latitude, $rootScope.cameras[index].location.longitude),
				map: $rootScope.map,
				icon: new google.maps.MarkerImage(
					'img/noFav.png',
					null,
					null,
					null,
					new google.maps.Size(25, 34)
				),
				optimized: false
			});
			
			markerClick(index, marker);
		}
	};
})
.controller('ClosuresCtrl', function($scope, $http, $ionicModal, $ionicLoading, $rootScope) {
	$scope.islands = [
		{
			name: 'Weekend',
			slug: 'weekend',
			nick: ''
		},
		{
			name: 'Oahu',
			slug: 'oahu',
			nick: 'The Gathering Place'
		},
		{
			name: 'Kauai',
			slug: 'kauai',
			nick: 'The Garden Isle'
		},
		{
			name: 'Maui',
			slug: 'maui',
			nick: 'The Valley isle'
		},
		{
			name: 'Big Island',
			slug: 'hawaii',
			nick: 'The Big Island'
		},
		{
			name: 'Lanai',
			slug: 'lanai',
			nick: 'The Pineapple Isle'
		},
		{
			name: 'Molokai',
			slug: 'molokai',
			nick: 'The Friendly Isle'
		}
	];
	
	$scope.islandnames = {
		weekend: 'Weekend',
		oahu: 'Oahu',
		kauai: 'Kauai',
		maui: 'Maui',
		hawaii: 'Big Island',
		lanai: 'Lanai',
		molokai: 'Molokai'
	};
	
	$ionicModal.fromTemplateUrl('templates/closureModal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.modal = modal;
	});
	
	$scope.showClosures = function(island, name) {
		$scope.activeIsland = island;
		
		if(!$rootScope.hasWarning) {
			$ionicLoading.show({
				template: '<span style="display: block;">Putting up road blocks for fun...</span>',
			});
		}
		
		$http.get('http://ai-no-kea.com/hitrafficcams/proxy/closures/?island=' + island).
		success(function(data) {
			$scope.closureTitle = name;
			$scope.closure = data;
			$scope.modal.show();
			$ionicLoading.hide();
		});
	};
	
	if(!$rootScope.hasWarning) {
		if(localStorage.closureIsland !== 'none') {
			$scope.showClosures(localStorage.closureIsland, $scope.islandnames[localStorage.closureIsland]);
		}
	}
})
.controller('IncidentsCtrl', function($scope, $http, $ionicLoading, $rootScope) {
	if(!$rootScope.hasWarning) {
		$ionicLoading.show({
			template: '<span style="display: block;">Looking for drivers using cell phones...</span>',
		});
	}
	
	$http({method: 'GET', url: 'http://ai-no-kea.com/hitrafficcams/proxy/twitter/1.1/search/tweets.php?q=%23hitraffic'}).
	success(function(response) {
		var items = [];
		
		function compare(a,b) {
			if (b.date < a.date) {
				return -1;
			}
			if (b.date > a.date) {
				return 1;
			}
		}
		
		angular.forEach(response.statuses, function(value) {
			var itemObject = {};
			itemObject.text = value.text;
			itemObject.screenName = value.user.screen_name;
			itemObject.name = value.user.name;
			itemObject.userImage = value.user.profile_image_url;
			itemObject.date = new Date(value.created_at).getTime();
			itemObject.method = 'twitter';
			if(value.entities.urls.length >= 1) {
				itemObject.entityType = 'url';
				itemObject.entity = value.entities.urls[0].url;
			}
			if(value.entities.media && value.entities.media[0].type === "photo") {
				itemObject.entityType = 'photo';
				itemObject.entity = value.entities.media[0].media_url + ':medium';
			}
			items.push(itemObject);
		});
		
		items.sort(compare);
		
		$scope.incidents = items;
		
		$ionicLoading.hide();
		
		$scope.incidentDate = function(string) {
			return moment(string).fromNow();
		};
		
		$scope.goToURL = function(link) {
			window.open(link, '_system', 'location=yes');
			return false;
		};
	}).
	error(function() {
		
	});
})
.controller('SettingsCtrl', function($scope, $ionicModal, $rootScope, $timeout, $ionicLoading) {
	$ionicModal.fromTemplateUrl('templates/raptor.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.modal = modal;
	});

	if(localStorage.favOnStart) {
		$scope.favOnStart = localStorage.favOnStart;
	}
	else {
		$scope.favOnStart = 'map';
	}
	
	if(localStorage.showTrafficOption) {
		$scope.showTrafficOption = localStorage.showTrafficOption;
	}
	else {
		$scope.showTrafficOption = false;
	}
	
	$scope.toggleFavOnStart = function(which) {
		localStorage.favOnStart = which;
		$scope.favOnStart = which;
	};
	
	$scope.showTraffic= function(option) {
		localStorage.showTrafficOption = option;
		$scope.showTrafficOption = option;
		
		if($rootScope.map) {
			if(option === 'true') {
				$rootScope.trafficLayer.setMap($rootScope.map);
			}
			else {
				$rootScope.trafficLayer.setMap(null);
			}
		}
	};
	
	$scope.raptorize = function() {
		$scope.modal.show();
		if(window.cordova) {
			var media = new Media('/android_asset/www/raptor/raptor.mp3');
			media.play();
		}
		
		$timeout(function() {
			$scope.modal.hide();
		}, 3000);
	};
	
	if(localStorage.closureIsland) {
		$scope.closureIsland = localStorage.closureIsland;
	}
	
	$scope.setClosureIsland = function(island) {
		localStorage.closureIsland = island;
	};
	
	$scope.islands = [
		{
			name: 'None',
			slug: 'none'
		},
		{
			name: 'Weekend',
			slug: 'weekend'
		},
		{
			name: 'Oahu',
			slug: 'oahu'
		},
		{
			name: 'Kauai',
			slug: 'kauai'
		},
		{
			name: 'Maui',
			slug: 'maui'
		},
		{
			name: 'Big Island',
			slug: 'hawaii'
		},
		{
			name: 'Lanai',
			slug: 'lanai'
		},
		{
			name: 'Molokai',
			slug: 'molokai'
		}
	];
	
	$scope.hasRaptor = localStorage.hasRaptor;
	$scope.raptorCount = 0;
	
	$scope.$on('$ionicView.leave', function(){
		$scope.raptorCount = 0;
	});
	
	$scope.raptorPress = function(count) {
		if(count < 4) {
			$scope.raptorCount++;
		}
		else {
			if($scope.hasRaptor) {
				$scope.raptorCount = 0;
				
				$ionicLoading.show({
					template: 'You\'ve already unlocked the raptor.',
				});
				
				$timeout(function() {
					$ionicLoading.hide();
				}, 3000);
			}
			else {
				$scope.raptorCount = 0;
				
				localStorage.hasRaptor = true;	
				$scope.hasRaptor = true;
				
				$scope.raptorize();
				
				$ionicLoading.show({
					template: 'Congratulations, you\'ve unlocked the raptor.',
				});
				
				$timeout(function() {
					$ionicLoading.hide();
				}, 3000);
			}
		}
	};
})
.service('alertServices', function($ionicPopup) {
	return {
		makeAlert: function(title, message, button, callback) {
			if(navigator.notification) {
				navigator.notification.alert(message, callback, title, button);
			}
			else {
				$ionicPopup.alert({
					title: title,
					content: message,
					okText: button
				}).then(function() {
					callback();
				});
			}
		}
	};
})
.filter('trustUrl', function ($sce) {
	return function(url) {
		return $sce.trustAsResourceUrl(url);
	};
});