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

    var updateInterval = 1000;
    var updateIntervalId = 0;

    var lastClicks = 0;

    var sendingClicks = 0;
    var renderedClicks = 0;
    var allClicks = 0;
    var localClicks = 0;
    var localClicksSend = 0;

    var appRef = database.ref('app');
    var clickerRef = database.ref('clicker');
    var usersRef = database.ref('users');
    var userRef = null;
    var userClicksRef = null;
    var clicksRef = database.ref('clicker/clicks');
    var goalsRef = database.ref('goals');
    var leaderBoardRef = database.ref('users').limitToLast(10).orderByChild('clicks');


    login();

    var $button = $('#clicker');
    var $clickCount = $('#clicks');
    var $progressContainer = $('#progress-container');
    var $leaderboard = $('#leaderboard');


    goalsRef.on('child_added', updateGoals);
    goalsRef.on('child_removed', updateGoals);
    goalsRef.on('child_changed', updateGoals);

    leaderBoardRef.on('child_added', addLeaderboard);
    leaderBoardRef.on('child_removed', removeLeaderboard);
    leaderBoardRef.on('child_changed', addLeaderboard);


    appRef.on('value', function (data, prev) {
        var val = data.val();
        if (val.updateInterval) {
            updateInterval = val.updateInterval;
        }
        clearInterval(updateIntervalId)
        updateIntervalId = setInterval(updateLoop, updateInterval);
    })

    clickerRef.on('value', function (data, prev) {
        var val = data.val();
        if (val.clicks) {
            localClicks -= sendingClicks;
            sendingClicks = 0;
            allClicks = val.clicks;
            incrementClick();
        }
    });


    function updateLoop() {
        if (localClicks <= 0) {
            return;
        }
        sendingClicks = localClicks;
        userClicksRef.transaction(function (clickcount) {
            if (clickcount >= 0) {
                clickcount += sendingClicks;
            }
            else {
                clickcount = 0;
            }
            return clickcount;
        }, function(error){
            if (!error) {
                // localClicks -= sendingClicks;
            }
        });
    }

    /**
     * We're all logged in and setup, we can now accept user input
     */
    function ready() {
        $button.on('click', function (e) {
            e.preventDefault();

            localClicks++;
            incrementClick();
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
                        user.name = prompt("What's your name? (for the leaderboard)");
                        usersRef.child(user.uid).set(user);
                    }
                    else {
                        user = data.val();
                        if (!user.name) {
                            user.name = prompt("What's your name? (for the leaderboard)");
                            usersRef.child(user.uid).set(user);
                        }
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

        if (lastClicks >= clicks) {
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

    function addLeaderboard(data) {
        var val = data.val();
        $existing = $leaderboard.find('#' + val.uid);
        if ($existing.length === 0) {
            $leaderboard.append('<li data-clicks="' + val.clicks + '" id="' + val.uid + '">' + val.name + ' - ' + val.clicks + '</li>')
        }
        else {
            $existing.text(val.name + ' - ' + val.clicks).data('clicks', val.clicks);
        }
        sortLeaderboard();
    }

    function removeLeaderboard(data) {
        var val = data.val();
        $existing = $leaderboard.find('#' + val.uid);
        $existing.remove();
        sortLeaderboard();
    }

    function sortLeaderboard() {
        $leaderboard.find('li').sort(function (a, b) {
            return $(b).data('clicks') - $(a).data('clicks');
        }).appendTo($leaderboard);
    }

    function updateGoals() {
        goalsRef.once('value', function(data){
            progressBars = [];
            $progressContainer.html('');
            var goals = data.val();
            for(goal in goals) {
                var name = goal;
                var count = goals[goal];
                var $container = $('<div class="goal"><h4>' + name + ' - ' + count + '</h4></div>');
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