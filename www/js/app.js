// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers'])
	.run(function($ionicPlatform, $ionicModal, $rootScope, $interval) {
		$ionicPlatform.ready(function() {
			// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
			// for form inputs)
			if(window.cordova && window.cordova.plugins.Keyboard) {
				cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
				cordova.plugins.Keyboard.disableScroll(true);
			}

			if(window.StatusBar) {
				// org.apache.cordova.statusbar required
				StatusBar.styleDefault();
			}
		});
		
		if(!localStorage.closureIsland) {
			localStorage.closureIsland = 'none';
		}
		
		if(!localStorage.understood || localStorage.understoodTime <= (new Date().valueOf() - 2592000000)) {
			$rootScope.hasWarning = true;
			
			$ionicModal.fromTemplateUrl('templates/warningModal.html', {
				scope: $rootScope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				$rootScope.warningModal = modal;
				
				$rootScope.warningModal.show();
			});
		}
		
		$rootScope.understood = function() {
			localStorage.understood = true;
			localStorage.understoodTime = new Date().valueOf();
			
			$rootScope.warningModal.hide();
		}
	})

	.config(function($stateProvider, $urlRouterProvider) {
		$stateProvider
			.state('app', {
				url: '/app',
				abstract: true,
				templateUrl: 'templates/menu.html',
			})
			.state('app.map', {
				url: '/map',
				views: {
					'menuContent': {
						templateUrl: 'templates/map.html',
						controller: 'MapCtrl'
					}
				}
			})
			.state('app.favorites', {
				url: '/favorites',
				views: {
					'menuContent': {
						templateUrl: 'templates/favorites.html',
						controller: 'FavoritesCtrl'
					}
				}
			})
			.state('app.closures', {
				url: '/closures',
				views: {
					'menuContent': {
						templateUrl: 'templates/closures.html',
						controller: 'ClosuresCtrl'
					}
				}
			})
			.state('app.incidents', {
				url: '/incidents',
				views: {
					'menuContent': {
						templateUrl: 'templates/incidents.html',
						controller: 'IncidentsCtrl'
					}
				}
			})
			.state('app.settings', {
				url: '/settings',
				views: {
					'menuContent': {
						templateUrl: 'templates/settings.html',
						controller: 'SettingsCtrl'
					}
				}
			});
			
			if(localStorage.favOnStart === 'favorites') {
				$urlRouterProvider.otherwise('/app/favorites');
			}
			else if(localStorage.favOnStart === 'closures') {
				$urlRouterProvider.otherwise('/app/closures');
			}
			else if(localStorage.favOnStart === 'incidents') {
				$urlRouterProvider.otherwise('/app/incidents');
			}
			else {
				$urlRouterProvider.otherwise('/app/map');
			}
	});
