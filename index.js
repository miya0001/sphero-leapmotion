var Leap = require('leapjs');
var spheron = require('spheron');

var device = '/dev/cu.Sphero-PRO-AMP-SPP';

var controlSphero = function(sphero) {

    var minSpeed = 60;
    var maxSpeed = 128;
    var minAngle = 0.2;

    sphero.state = {
        speed: 0,
        dir:   0,
        flag:  0
    };

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
                send(getSpeed(pitch), 180, 1);
            } else if (pitch < (0 - minAngle)) {
                send(getSpeed(pitch), 0, 1);
            } else if (roll > minAngle) {
                send(getSpeed(roll), 270, 1);
            } else if (roll < (0 - minAngle)) {
                send(getSpeed(roll), 90, 1);
            } else {
                stopSphero();
            }
        }
    };

    var send = function(speed, dir, flag) {
        if (isStateChanged(speed, dir, flag)) {
            sphero.roll(speed, dir, flag);
            if (speed == maxSpeed) {
                ball.setRGB(spheron.toolbelt.COLORS.YELLOW).setBackLED(255);
            } else if (speed == minSpeed){
                ball.setRGB(spheron.toolbelt.COLORS.GREEN).setBackLED(255);
            } else {
                ball.setRGB(spheron.toolbelt.COLORS.BLUE).setBackLED(255);
            }
            sphero.state = {
                speed: speed,
                dir:   dir,
                flag:  flag
            };
        }
    };

    var isStateChanged = function(speed, dir, flag) {
        if (sphero.state.speed == speed) {
            if (sphero.state.dir == dir) {
                if (sphero.state.flag == flag) {
                    return false;
                }
            }
        }

        return true;
    }

    var getSpeed = function(angle) {
        if (Math.abs(angle) > 0.4) {
            speed = maxSpeed;
        } else {
            speed = minSpeed;
        }
        return speed;
    };

    var setHeading = function(g) {
        if (g.state === 'stop') {
            if (g.normal[2] < 0) {
                send(0, 45, 0);
            } else {
                send(0, 315, 0);
            }
            sphero.write(spheron.commands.api.setHeading(0));
        }
    };

    var stopSphero = function(sphero) {
        ball.setRGB(spheron.toolbelt.COLORS.BLUE).setBackLED(255);
        send(0, 0, 0);
    };

    controller.connect();
};


var ball = spheron.sphero().resetTimeout(true);
ball.open(device);

ball.on('open', function() {
    ball.setRGB(spheron.toolbelt.COLORS.BLUE).setBackLED(255);
    controlSphero(ball);
});

