$(function() {
    // Set the configuration for your app
    const config = {
        apiKey: "AIzaSyCgGZ3tKR0641h4tz5aS5MO3oHeaMRXay0",
        authDomain: "bomb-clicker.firebaseapp.com",
        databaseURL: "https://bomb-clicker.firebaseio.com",
    };
    firebase.initializeApp(config);

    // Get a reference to the database service
    var database = firebase.database();

    window.progressBars = [];

    var clickCounter = 0;

    var user = {
        uid: null,
        clicks: 0
    };

    const reportInterval = 1000;
    var lastReport = 0;


    var lastClicks = 0;

    var allClicks = 0;
    var localClicks = 0;

    var clickerRef = database.ref('clicker');
    var usersRef = database.ref('users');
    var userRef = null;
    var userClicksRef = null;
    var clicksRef = database.ref('clicker/clicks');
    var goalsRef = database.ref('goals');

    login();

    var $button = $('#clicker');
    var $clickCount = $('#clicks');
    var $progressContainer = $('#progress-container');


    goalsRef.on('child_added', updateGoals);
    goalsRef.on('child_removed', updateGoals);
    goalsRef.on('child_changed', updateGoals);


    clickerRef.on('value', function (data, prev) {
        var val = data.val();
        if (val.clicks) {
            // allClicks = val.clicks;
            // incrementClick();
        }
    });

    /**
     * We're all logged in and setup, we can now accept user input
     */
    function ready() {
        $button.on('click', function (e) {
            e.preventDefault();

            localClicks++;
            incrementClick();

            if (lastReport + reportInterval > Date.now()) {
                return;
            }

            lastReport = Date.now();

            // userClicksRef.transaction(function (clickcount) {
            //     if (clickcount >= 0) {
            //         clickcount += localClicks;
            //     }
            //     else {
            //         clickcount = 0;
            //     }
            //     return clickcount;
            // });


            clicksRef.transaction(function(clickcount){
                if (clickcount >= 0) {
                    clickcount += localClicks;
                }
                else {
                    clickcount = 0;
                }
                return clickcount;
            }, function (error) {
                clicksRef.once('value', function (data){
                    var val = data.val()
                    if (val) {
                        localClicks = 0;
                        allClicks = val;
                        incrementClick();
                    }
                });
            });
        });
    }

    function login() {
        firebase.auth().onAuthStateChanged(function(val) {
            if (val) {
                user.uid = val.uid;
                userRef = usersRef.child(user.uid);
                userClicksRef = userRef.child('clicks');
                userRef.once('value', function(data){
                    if (data.val() === null) {
                        usersRef.child(user.uid).set(user);
                    }
                    else {
                        user = data.val();
                    }
                    ready();
                });
            }
            // User logout
            else {
            }
        });
        firebase.auth().signInAnonymously().catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;
        });
    }



    function incrementClick() {
        var clicks = allClicks + localClicks;
        if (lastClicks > clicks) {
            return;
        }
        lastClicks = clicks;
        clickCounter = clicks;
        $clickCount.text(clicks);
        for (var i = 0; i < progressBars.length; i++) {
            var $bar = progressBars[i];
            var goal = parseInt($bar.data('goal'));
            if (clicks >= goal && !$bar.hasClass('bg-success')) {
                $bar.css('width', '100%');
                $bar.addClass('bg-success');
                $progressContainer.find('.goal').sort(function (a, b) {
                    $a = $(a).find('.progress-bar');
                    $b = $(b).find('.progress-bar');
                    var aVal = $a.data('goal') <= clickCounter ? $a.data('goal') * 1000000 : $a.data('goal');
                    var bVal = $b.data('goal') <= clickCounter ? $b.data('goal') * 1000000 : $b.data('goal');
                    return aVal - bVal;
                }).appendTo($progressContainer);
            }
            else {
                var percent = clicks / goal * 100;
                $bar.css('width', percent + '%');
            }
        }
    }

    function updateGoals() {
        goalsRef.once('value', function(data){
            progressBars = [];
            $progressContainer.html('');
            var goals = data.val();
            for(goal in goals) {
                var name = goal;
                var count = goals[goal];
                var $container = $('<div class="goal"><h2>' + name + ' - ' + count + '</h2></div>');
                var $progress = $('<div class="progress"></div>');

                var $progressBar = $('<div data-goal="' + count + '" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div>');
                progressBars.push($progressBar);
                $progress.append($progressBar);
                $container.append($progress);
                $progressContainer.append($container);
            }
        });
        clickerRef.once('value', function (data, prev) {
            var val = data.val();
            if (val.clicks) {
                allClicks = val.clicks;
                incrementClick();
            }
        });
    }


});