var Leap = require('leapjs');
var spheron = require('spheron');

var device = '/dev/cu.Sphero-PRO-AMP-SPP';

var controlSphero = function(sphero) {

    var minSpeed = 60;
    var maxSpeed = 100;
    var minAngle = 0.2;

    var controller = new Leap.Controller({
        frameEventName: 'deviceFrame',
        enableGestures:true
    });

    controller.on('frame', function(frame) {
        if (frame.pointables.length === 1 && frame.gestures.length && frame.gestures[0].type == 'circle') {
            setHeading(frame.gestures[0]);
        } else if (frame.pointables.length > 3) {
            move(frame);
        } else if (frame.pointables.length === 0){
            stopSphero(sphero);
        }
    });

    var move = function(frame) {
        if (frame.hands.length && frame.hands[0]) {
            var hand = frame.hands[0];

            var roll  = hand.roll(); // 0 < left & 0 > right
            var pitch = hand.pitch(); // 0 < forward & 0 > back

            if (pitch > minAngle) {
                sphero.roll(getSpeed(pitch), 180, 1);
            } else if (pitch < (0 - minAngle)) {
                sphero.roll(getSpeed(pitch), 0, 1);
            } else if (roll > minAngle) {
                sphero.roll(getSpeed(roll), 270, 1);
            } else if (roll < (0 - minAngle)) {
                sphero.roll(getSpeed(roll), 90, 1);
            } else {
                stopSphero(sphero);
            }
        }
    };

    var getSpeed = function(angle) {
        if (Math.abs(angle) > 0.4) {
            speed = maxSpeed;
        } else {
            speed = minSpeed;
        }
        return speed;
    }

    var setHeading = function(g) {
        if (isNaN(sphero.heading)) {
            sphero.heading = 0;
        }
        if (g.normal[2] < 0) {
            sphero.heading += 1;
            if (sphero.heading >= 360) {
                sphero.heading -= 360;
            }
        } else {
            sphero.heading -= 1;
            if (sphero.heading < 0) {
                sphero.heading += 360;
            }
        }

        sphero.roll(0, sphero.heading, 0);

        if (g.state === 'stop') {
            sphero.heading = 0;
            sphero.write(spheron.commands.api.setHeading(0));
        }
    };

    controller.connect();
};


var stopSphero = function(sphero) {
    sphero.roll(0, 0, 0);
};

var ball = spheron.sphero().resetTimeout(true);
ball.open(device);

ball.on('open', function() {
    ball.setRGB(spheron.toolbelt.COLORS.BLUE).setBackLED(255);
    controlSphero(ball);
});

