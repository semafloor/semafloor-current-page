var _alphaFloors = [
  'level 1','level 2','level 3','level 3A','level 5','level 6',
  'level 7','level 8','level 9','level 10','level 11','level 12'];
var _alphaFloorsCode = [
  '01level','02level','03level','04level','05level','06level',
  '07level','08level','09level','10level','11level','12level'];
var _siteNames = ['KLB - Tower 5','KLB - Tower 2A','SUITE'];

Polymer({

  is: 'semafloor-current-page',

  properties: {
    selectedSite: {
      type: String,
      value: 'KLB - Tower 5'
    },
    selectedFloor: {
      type: String,
      value: '13level'
    },
    selectedFloorName: {
      type: String,
      value: 'Level 13'
    },
    selectedRoomName: {
      type: String,
      value: 'El Psy Kongroo'
    },

    _selectedPage: {
      type: String,
      value: 'waiting'
    },
    _floorsAtSelectedSite: {
      type: Array,
      value: function() {
        return _alphaFloors;
      },
      computed: '_computeFloorsAtSelection(selectedSite, _currentReservations)'
    },

    _currentReservations: {
      type: Object,
      value: function() {
        return {};
      }
    },
    _allSitesData: Object,

    _url: {
      type: String,
      // value: 'https://semafloor-webapp.firebaseio.com/json/current-reservations'
      value: function() {
        function _getWeek(_fulldate) {
          var _now = new Date(_fulldate.getFullYear(), _fulldate.getMonth(), _fulldate.getDate() - _fulldate.getDay() + 4);
          var _onejan = new Date(_now.getFullYear(), 0, 1);

          return Math.ceil(((_now - _onejan) / 86400000 + 1) / 7);
        }

        function _getMonthName(_month) {
          var _monthName = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];

          return _monthName[_month];
        }

        var _today = new Date();
        var _baseRef = 'https://polymer-semaphore.firebaseio.com/mockMessages';
        var _year = _today.getFullYear();
        var _month = _.padStart(_today.getMonth(), 2, '0') + _getMonthName(_today.getMonth());
        var _week = 'week' + _.padStart(_getWeek(_today), 2, '0');
        var _date = _.padStart(_today.getDate(), 2, '0');

        return [_baseRef, _year, _month, _week, _date, 'reservations'].join('/');
        // TODO: For development purpose...
        // return [_baseRef, _year, _month, 'week07', 17].join('/');
      }
    },
    _floorStatus: Object,

    _roomsAtSelectedFloor: {
      type: Array,
      value: function() {
        return [];
      },
      computed: '_computeRoomsAtSelection(selectedSite, selectedFloor, _currentReservations)'
    },
    _infoAtSelectedRoom: {
      type: Array,
      value: function() {
        return [];
      }
    },

    _reservationDetails: Object,
    _detailAtSelectedRoom: Array,

  },

  observers: [
    '_whenSelectedSiteChanged(selectedSite)',
    '_referenceToUserFirebase(uid)',
    '_computeFloorStatus(_currentReservations, selectedSite)'
  ],

  // Element Lifecycle
  created: function() {
    // console.log('semafloor-current-created');
    // console.time('semafloor-current-ready');
    // console.time('semafloor-current-attached');
  },

  ready: function() {
    // `ready` is called after all elements have been configured, but
    // propagates bottom-up. This element's children are ready, but parents
    // are not.
    //
    // This is the point where you should make modifications to the DOM (when
    // necessary), or kick off any processes the element wants to perform.
    // console.timeEnd('semafloor-current-ready');
  },

  attached: function() {
    // `attached` fires once the element and its parents have been inserted
    // into a document.
    //
    // This is a good place to perform any work related to your element's
    // visual state or active behavior (measuring sizes, beginning animations,
    // loading resources, etc).

    // TODO: load external resources, eg. Firebase.
    this.fire('current-page-attached');
    // console.timeEnd('semafloor-current-attached');
  },

  detached: function() {
    // The analog to `attached`, `detached` fires when the element has been
    // removed from a document.
    //
    // Use this to clean up anything you did in `attached`.
  },

  _onFirebaseValue: function(ev) {
    console.log(ev.detail.val());
    var _firebaseData = ev.detail.val();
    // hide spinner and switch to room page.
    if (this.selectedFloor !== '13level' && this._selectedPage === 'waiting') {
      this.set('_selectedPage', 'room');
    }

    // fire an event when data is fetched.
    this.fire('current-reservations-ready');

    // Set _allSitesData first before _currentReservations.
    this.set('_allSitesData', _firebaseData.site);
    this.set('_currentReservations', _.sortBy(_.pickBy(_firebaseData.reservations, function(_value, _key) { return _key.length > 4; }), ['fromTime']));

    console.log('on-firebase-value');
  },

  _computeFloorsAtSelection: function(_selectedSite) {
    return [_alphaFloors, ['level 3'], ['level 1']][_siteNames.indexOf(_selectedSite)];
  },
  _whenSelectedSiteChanged: function(_selectedSite) {
    // go back to floor page when select on another site at floor page.
    if (this._selectedPage !== 'floor') {
      this.set('_selectedPage', 'floor');
    }
  },
  _computeFloorStatus: function(_currentReservations, _selectedSite) {
    // X - TODO: Major change as global reservations list now has total different structure.
    if (_.isUndefined(_currentReservations) || _.isEmpty(_currentReservations) || _.isUndefined(_selectedSite)) {
      return;
    }

    var _floorsToBeInspected = _alphaFloorsCode;
    var _siteIdx = _siteNames.indexOf(_selectedSite);
    var _siteCode = ['alpha', 'beta', 'gamma'][_siteIdx];

    var _now = new Date();
    var _nowHours = _now.getHours();
    var _nowMinutes = _now.getMinutes();
    var _nowInMinutes = _nowHours * 60 + _nowMinutes;
    var _isDivisibleByHalfHour = _nowInMinutes % 30 === 0;

    var _backwardTimeInHours = _isDivisibleByHalfHour ? _nowInMinutes / 30 - 1 : Math.floor(_nowInMinutes / 30);
    var _forwardTimeInHours = _isDivisibleByHalfHour ? _nowInMinutes / 30 : Math.ceil(_nowInMinutes / 30);

    var _backwardTimeString = _.padStart(Math.floor(_backwardTimeInHours / 2), 2, '0') + ':' + _.padStart(_backwardTimeInHours / 2 % 1 * 60, 2, '0');
    var _forwardTimeString = _.padStart(Math.floor(_forwardTimeInHours / 2), 2, '0') + ':' + _.padStart(_forwardTimeInHours / 2 % 1 * 60, 2, '0');

    var _extractedReservationsTemp = {};
    var _reservationDetailsTemp = {};
    _.forEach(_currentReservations, function(n) {
      if (n.roomInfo.site === _selectedSite) {
        if (n.fromTime >= _backwardTimeString && n.fromTime <= _forwardTimeString) {
          // X - TODO: To filter reservations at current time period.
          var _lowerFirstLevel = _.lowerFirst(n.roomInfo.floor);
          var _convertedFloorIdx = _alphaFloors.indexOf(_lowerFirstLevel);
          var _convertedFloorCode = _alphaFloorsCode[_convertedFloorIdx];
          if (_.isUndefined(_extractedReservationsTemp[_lowerFirstLevel])) {
            _extractedReservationsTemp[_lowerFirstLevel] = [];
            _reservationDetailsTemp[_lowerFirstLevel] = {};
          }
          _extractedReservationsTemp[_lowerFirstLevel].push(n.roomInfo.room);
          _reservationDetailsTemp[_lowerFirstLevel][n.roomInfo.room] = n;
        }

      }
    });

    _.forIn(_extractedReservationsTemp, function(n, _key) {
      _extractedReservationsTemp[_key] = _.uniq(n);
    });

    this.set('_floorStatus', _extractedReservationsTemp);
    this.set('_reservationDetails', _reservationDetailsTemp);
  },
  _isVacantFloor: function(_currentReservations, _selectedSite, _item) {
    // TODO: To test if all rooms at one floor are reserved at the same time, the status should turn red from green.
    if (_.isEmpty(_currentReservations) || _.isUndefined(_currentReservations)) {
      return '';
    }

    var _allSitesData = this._allSitesData;
    var _isVacantFloor = true;
    var _allFloors = [];

    if (_selectedSite === 'KLB - Tower 2A') {
      if (_item === 'level 3') {
        _allFloors = _.keys(_allSitesData['beta']['03level']);
        _isVacantFloor = _.isEqual(_allFloors, _currentReservations['03level']);
        return _isVacantFloor ? ' fully-occupied' : '';
      }

      return '';
    }else if (_selectedSite === 'SUITE') {
      if (_item === 'level 1') {
        _allFloors = _.keys(_allSitesData['gamma']['01level']);
        _isVacantFloor = _.isEqual(_allFloors, _currentReservations['01level']);
        return _isVacantFloor ? ' fully-occupied' : '';
      }

      return '';
    }else {
      var _floorIdx = _alphaFloors.indexOf(_item);
      var _floorCode = _alphaFloorsCode[_floorIdx];
      _allFloors = _.keys(_allSitesData['alpha'][_floorCode]);
      _isVacantFloor = _.isEqual(_allFloors, _currentReservations[_item]);
      return _isVacantFloor ? ' fully-occupied' : '';
    }
  },
  _unveilFloor: function(ev) {
    // X - TODO: Minor change as global reservations list now has total different structure.
    var _target = ev.target;

    if (_target && _target.hasAttribute('floor')) {
      var _floor = ev.model.item;
      var _selectedSite = ev.model.selectedSite;

      if (_.isEmpty(this._currentReservations) || _.isUndefined(this._currentReservations)) {
        this.set('_selectedPage', 'waiting');
      }else {
        this.set('_selectedPage', 'room');
      }

      this.set('selectedFloor', _floor === 'level 3A' ? '04level' : _alphaFloorsCode[_alphaFloors.indexOf(_floor)]);
      this.set('selectedFloorName', _floor);
    }
  },
  _backSite: function() {
    this.set('selectedFloor', null);
    this.set('selectedFloorName', null);
    this.set('_selectedPage', 'floor');
  },

  _computeRoomsAtSelection: function(_selectedSite, _selectedFloor, _currentReservations) {
    // X - TODO: Major change as global reservations list now has total different structure.
    if (_.isUndefined(_currentReservations) || _.isEmpty(_currentReservations) || _.isEmpty(_selectedFloor)) {
      return [];
    }

    var _decodedSite = ['alpha', 'beta', 'gamma'][_siteNames.indexOf(_selectedSite)];
    var _floorData = this._allSitesData[_decodedSite][_selectedFloor];
    var _rooms = _.keys(_floorData);

    return _rooms;
  },
  _unveilRoom: function(ev) {
    var _target = ev.target;

    if (_target && _target.hasAttribute('room')) {
      // X - TODO: Only show info of reservations at current time period.
      var _selectedSite = this.selectedSite;
      var _selectedFloor = this.selectedFloor;
      var _selectedItem = ev.model.item
      var _decodedSite = ['alpha', 'beta', 'gamma'][_siteNames.indexOf(_selectedSite)];
      var _decodedFloor = _alphaFloors[_alphaFloorsCode.indexOf(_selectedFloor)];
      var _temp = this._allSitesData[_decodedSite][_selectedFloor][_selectedItem];

      var _detailAtSelectedRoom = _.isUndefined(this._reservationDetails[_decodedFloor]) ? '' : this._reservationDetails[_decodedFloor][_selectedItem];
      _temp['name'] = _selectedItem;

      this.set('_selectedPage', 'info');

      this.set('_detailAtSelectedRoom', [_detailAtSelectedRoom]);
      this.set('selectedRoomName', _selectedItem);
      this.set('_infoAtSelectedRoom', [_temp]);
    }
  },
  _backRoom: function() {
    this.set('selectedRoomName', null);
    this.set('_selectedPage', 'room');
  },
  _isVacantRoom: function(_item) {
    // X - TODO: Minor change due to different structure of global reservations list.
    // ? - TODO: It's quite hard to be of status RESERVED in this system.

    var _ff;
    var _fs = this._floorStatus;
    var _isVacantRoom = true;

    if (_.isObject(_item)) {
      _ff = _.lowerFirst(_item.floor);
      if (!_.isUndefined(_fs[_ff])) {
        _isVacantRoom = _fs[_ff].indexOf(_item.name) < 0;
      }
    }else {
      _ff = _alphaFloors[_alphaFloorsCode.indexOf(this.selectedFloor)];
      if (!_.isUndefined(_fs[_ff])) {
        _isVacantRoom = _fs[_ff].indexOf(_item) < 0;
      }
    }

    var _cls = _isVacantRoom ? '' : ' fully-occupied';

    return _cls;
  },
  _isRoomLocked: function(_locked) {
    return JSON.parse(_locked) ? '-open' : '';
  },
  _isRoomLockedMsg: function(_locked) {
    return JSON.parse(_locked) ? 'This room is open to the public.' : 'This room has restricted access to the public.';
  },
  _isRoomOccupied: function(_item) {
    // X - TODO: Minor change due to different strucutre in global reservations list.
    _ff = _.lowerFirst(_item.floor);
    var _fs = this._floorStatus;
    var _isVacantRoom = true;

    if (!_.isUndefined(_fs[_ff])) {
      _isVacantRoom = _fs[_ff].indexOf(_item.name) < 0;
    }

    return _isVacantRoom ? 'unchecked' : 'checked';
  },

  // workaround for importHref.
  // Nothing shows when switch to other page while the page is loading even it's loaded.
  updateCurrentPages: function() {
    this.$.currentPages.notifyResize();
  },

});
