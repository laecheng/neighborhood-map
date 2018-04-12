// marker information
var initialMarkers = [
  {
    title: 'Downtown Berkeley',
    location: {lat: 37.868762, lng: -122.271464}
  },
  {
    title: 'Downtown Oakland',
    location: {lat: 37.806929, lng: -122.277327}
  },
  {
    title: 'Mission District',
    location: {lat: 37.762063, lng: -122.417624}
  },
  {
    title: 'Forest Knolls',
    location: {lat: 37.757695, lng: -122.463693}
  },
  {
    title: 'Visitacion Valley',
    location: {lat: 37.718136, lng: -122.403436}
  },
  {
    title: 'Twin Peaks',
    location: {lat: 37.755737, lng: -122.446144}
  },
  {
    title: 'Hunters Point',
    location: {lat: 37.727686, lng: -122.373778}
  },
  {
    title: 'Lakeshore',
    location: {lat: 37.723641, lng: -122.493824}
  }
];


function handleError() {
  alert("Google map api can not be loaded, app may not run properly. Please try again later");
}

function loadApp() {

  // Google map api create the map and create markers
  var map;

  function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 37.773972, lng: -122.431297},
      zoom: 11
    });
  }

  // the marker model
  var Marker = function(data) {
    var self = this;

    this.title = ko.observable(data.title);
    this.location = ko.observable(data.location);
    this.visibility = ko.observable(true);
    this.marker = ko.observable(new google.maps.Marker({
      position: data.location,
      title: data.title
    }));
    this.infoWindow = ko.observable(new google.maps.InfoWindow());

    self.marker().addListener('click', function() {
      self.showInfo();
    });

    self.infoWindow().addListener('closeclick', function() {
      self.marker().setAnimation(null);
    });

    this.showInfo = function() {
      var streetviewUrl = 'http://maps.googleapis.com/maps/api/streetview?size=150x100&location=' + self.title() + '';
      var content = '<div><h3>' + self.title() + '</h3></div>' +
                    '<img src="' + streetviewUrl + '">';
      self.infoWindow().setContent(content);
      self.infoWindow().open(map, self.marker());
      self.marker().setAnimation(google.maps.Animation.BOUNCE);
    };

    this.hideInfo = function() {
      self.marker().setAnimation(null);
      self.infoWindow().close();
    };

    this.showMarker = ko.computed(function() {
      if (self.visibility() === true) {
        self.marker().setMap(map);
      } else {
        self.marker().setMap(null);
      }
    }, this);
  };

  var Article = function(data) {
    this.url = ko.observable(data.web_url);
    this.headline = ko.observable(data.headline.main);
  };

  // the MVVM's view model
  var ViewModel = function() {
    var self = this;

    this.keyWord = ko.observable("");

    this.markerList = ko.observableArray([]);

    this.articleList = ko.observableArray([]);

    this.nytError = ko.observable("");

    initialMarkers.forEach(function(markerItem) {
      self.markerList.push(new Marker(markerItem));
    });

    this.filtedList = ko.computed(function() {
      var keyWord = self.keyWord().toLowerCase();
      if (keyWord === "") {
        self.markerList().forEach(function(marker){
          marker.visibility(true);
        });
        return self.markerList();
      } else {
        return ko.utils.arrayFilter(self.markerList(), function(marker) {
            var result = marker.title().toLowerCase().indexOf(keyWord) != -1;
            marker.visibility(result);
            return result;
        });
      }
    }, this);

    this.clickedLocation = ko.observable(this.markerList()[0]);

    this.showLocation = function(clicked) {
      self.clickedLocation(clicked);
      self.markerList().forEach(function(markerItem) {
        if (self.clickedLocation() != markerItem) {
          markerItem.hideInfo();
        } else {
          markerItem.showInfo();
        }
      });

      var location = self.clickedLocation().title();
      var url = "https://api.nytimes.com/svc/search/v2/articlesearch.json";
      url += '?' + $.param({'sort': "newest", 'q': location, 'api-key': "ad9f92889efc44cebc50c708753d32e4"});

      $.getJSON(url, function(data) {
        var articles = data.response.docs;
        self.articleList([]);
        articles.forEach(function(article) {
          self.articleList.push(new Article(article));
        });
      }).fail(function(e) {
        self.nytError("Sorry, Can not load news from New York Times.");
      });
    };
  };

  initMap();
  ko.applyBindings(new ViewModel());
}
