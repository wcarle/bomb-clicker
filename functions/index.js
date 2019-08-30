const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.updateMasterCount = functions.database.ref('/users/{uid}/clicks')
    .onWrite((change, context) => {
        var clicksRef = change.after.ref.root.child('clicker/clicks');
        var initial = 0;
        if (change.before.exists()) {
            initial = change.before.val();
        }

        if (change.after.exists()) {
            var increment = change.after.val() - initial;
            console.log('Increment: ' + increment);
            return clicksRef.transaction(function (clickcount) {
                if (clickcount >= 0) {
                    clickcount += increment;
                }
                else {
                    clickcount = 0;
                }
                console.log('New count: ' + clickcount);
                return clickcount;
            });
        }
        return false;
    });