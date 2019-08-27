$(function() {
    // Set the configuration for your app
    const config = {
        apiKey: "apiKey",
        authDomain: "bomb-clicker.firebaseapp.com",
        databaseURL: "https://bomb-clicker.firebaseio.com",
    };
    firebase.initializeApp(config);

    // Get a reference to the database service
    var database = firebase.database();

    window.progressBars = [];

    var clickCounter = 0;

    var clicker = database.ref('clicker');
    var clicks = database.ref('clicker/clicks');
    var goals = database.ref('goals');

    var $button = $('#clicker');
    var $clickCount = $('#clicks');
    var $progressContainer = $('#progress-container');

    $button.on('click', function (e) {
        e.preventDefault();

        clicks.transaction(function(clickcount){
            if (clickcount >= 0) {
                clickcount++;
            }
            else {
                clickcount = 0;
            }
            return clickcount;
        });
    });


    goals.on('child_added', updateGoals);
    goals.on('child_removed', updateGoals);
    goals.on('child_changed', updateGoals);


    clicker.on('value', function (data, prev) {
        var val = data.val();
        if (val.clicks) {
            incrementClick(val.clicks);
        }
    });

    function incrementClick(clicks) {
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
        goals.once('value', function(data){
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
        clicker.once('value', function (data, prev) {
            var val = data.val();
            if (val.clicks) {
                incrementClick(val.clicks);
            }
        });
    }


});