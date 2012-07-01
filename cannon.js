var canvas = document.getElementById("battleField");
var context = canvas.getContext("2d");
context.translate(0, 250);
context.scale(1, -1);

var canvasBar = document.getElementById("powerBar");
var contextBar = canvasBar.getContext("2d");
contextBar.translate(0, 250);
contextBar.scale(1, -1);

var power = 10;
var inverter = 1;
var keys = { "Enter": 13, "Space": 32, "Shift": 16, "Left": 37, "Right": 39, "Down": 40, "Up": 38 };

var totalShoots = 0;
var totalHits = 0;
var totalScore = 0;

var offsetX = 0;
var offsetY = 0;

function SetProperty(name, value) {
    document.getElementById(name).innerHTML = value;
}

function GetRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function GameMode() {
    this.distanceMode = 0;
    this.transp = 0;

    this.SetDistanceMode = function (mode) {
        this.distanceMode = mode;
        this.transp = 0.5;
    };

    this.Draw = function () {
        if (this.transp <= 0) return;
        context.fillStyle = "rgba(0, 150, 0, " + this.transp + ")";
        context.fillRect(this.GetLeftBorderX(), 0, this.GetRightBorderX() - this.GetLeftBorderX(), 2000);
        if (this.transp > 0) this.transp -= 0.005;
    };

    this.GetLeftBorderX = function () {
        switch (this.distanceMode) {
            case 2:
                return 550;
            case 3:
                return 750;
            default:
                return 350;
        }
    };

    this.GetRightBorderX = function () {
        switch (this.distanceMode) {
            case 1:
                return 550;
            case 2:
                return 750;
            default:
                return 950;
        }
    };
}

function PowerBar() {
    this.power = 0;
    this.lastPower = 0;
    this.doDrawLastPower = true;

    this.Draw = function () {
        contextBar.clearRect(0, 0, 40, 250);

        contextBar.fillStyle = "#999";
        contextBar.fillRect(0, 0, 40, this.power);

        contextBar.fillStyle = "rgb(255, 255, 165)";
        contextBar.fillRect(0, (this.power - 5), 40, 5);

        if (this.doDrawLastPower) {
            contextBar.fillStyle = "rgb(0, 255, 50)";
            contextBar.fillRect(0, (this.lastPower - 3), 40, 3);
        }
    };
}


function Aim() {

    this.x = GetRandomInt(gameMode.GetLeftBorderX(), gameMode.GetRightBorderX());
    this.y = GetRandomInt(10, 220);

    this.Draw = function () {
        context.beginPath();
        context.arc(this.x, this.y, 10, 0, Math.PI * 2, true);
        context.closePath();
        context.fillStyle = "rgb(0,255,255)";
        context.fill();
        context.strokeStyle = "black";
        context.stroke();
    };
}

function Cannonball(x, y, startAngle, startSpeed, g, doExists) {
    if (doExists == undefined) this.doExists = false;
    else this.doExists = doExists;
    
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.startAngle = startAngle;
    this.startSpeed = startSpeed;
    this.g = g;
    this.totalTime = 0;

    this.GetX = function(time) {
        return this.startX + this.startSpeed * time * Math.cos(this.startAngle);
    };

    this.GetY = function(time) {
        return this.startY + this.startSpeed * time * Math.sin(this.startAngle) - 0.5 * this.g * Math.pow(time, 2);
    };

    this.Move = function (time) {
        if (!this.doExists) return;

        var oldY = this.y;

        this.totalTime += time;
        this.x = this.GetX(this.totalTime);
        this.y = this.GetY(this.totalTime);

        SetProperty("shoot_length", this.x.toFixed(2) + " м");
        if (oldY < this.y) SetProperty("shoot_height", this.y.toFixed(2) + " м");

        if (this.CheckHit(aim)) {
            this.doExists = false;
            totalScore += aim.x - 300;
            aim = new Aim();
            totalHits++;
            SetProperty("hit_rate", (totalHits / totalShoots * 100).toFixed(2) + "%" + " (" + totalHits + " / " + totalShoots + ")");
            SetProperty("total_score", totalScore);
        }
        if (this.x > 980 || this.y < 0) this.doExists = false;
    };
    
    this.Draw = function() { 
        if (!this.doExists) return; 
        
        context.beginPath();
        context.arc(this.x, this.y, 10, 0, Math.PI * 2, true);
        context.closePath();
        context.fillStyle = "rgb(0,0,0)";
        context.fill();
    };

    this.DrawTail = function() {
        for (var i = 1; i < this.totalTime; i += 0.3) {
            context.beginPath();
            context.arc(this.GetX(i), this.GetY(i), 2, 0, Math.PI * 2, true);
            context.closePath();
            context.fillStyle = "rgb(0,0,0)";
            context.fill();
        }
    };

    this.CheckHit = function (aim) {
        if (Math.sqrt(Math.pow(aim.x - this.x, 2) + Math.pow(aim.y - this.y, 2)) < 20) return true;
        return false;
    };
}

function Cannon() {
    this.angle = 45;

    this.ChangeOrientation = function (shift) {
        this.angle += shift;
        if (this.angle > 90) this.angle = 90;
        if (this.angle < 0) this.angle = 0;
    };

    this.Draw = function () {
        context.moveTo(0, 0);
        context.lineTo(20, 20);
        context.lineTo(40, 0);
        context.moveTo(20, 20);
        context.lineTo(20 + (40 * Math.cos(this.angle * Math.PI / 180)), 20 + (40 * Math.sin(this.angle * Math.PI / 180)));
        context.stroke();
    };

    this.Fire = function (speed, angle) {
        cannonball = new Cannonball(20, 20, angle, speed, 4, true);
        powerBar.lastPower = speed * 2.5;
    };
}

var gameMode = new GameMode();
var cannon = new Cannon();
var cannonball = new Cannonball(20, 20, 0, 0, 4, false);
var aim = new Aim();
var powerBar = new PowerBar();


function Render() {
    context.save();

    if (cannonball.y > 200 && cannonball.doExists) offsetY = 200 - cannonball.y;
    else if (cannonball.y > 200 && !cannonball.doExists && offsetY < 0) offsetY -=  offsetY / 50;
    else offsetY = 0;
    
    context.translate(offsetX, offsetY);
    context.clearRect(-offsetX, -offsetY, 980, 250);

    gameMode.Draw();
    aim.Draw();
    powerBar.Draw();
    cannonball.Move(0.1);
    cannonball.Draw();
    cannonball.DrawTail();
    cannon.Draw();

    context.restore();
}

setInterval(Render, 9);
setInterval(function () {
    power += 1 * inverter;
    if (power > 100) inverter = -1;
    if (power < 10) inverter = 1;

    powerBar.power = power * 2.5;

}, 25);

function KeysHandlerDown(event) {
    if (event.keyCode == keys.Up || event.keyCode == keys.Left) cannon.ChangeOrientation(3);
    if (event.keyCode == keys.Down || event.keyCode == keys.Right) cannon.ChangeOrientation(-3);

    if (event.keyCode == keys.Shift) return;

    if (event.keyCode == keys.Space) {
        if (!cannonball.doExists) {
            cannon.Fire(power, cannon.angle * Math.PI / 180);
            SetProperty("shoot_power", power + "%");
            SetProperty("shoot_angle", cannon.angle + "°");
            totalShoots++;
            SetProperty("hit_rate", (totalHits / totalShoots * 100).toFixed(2) + "%" + " (" + totalHits + " / " + totalShoots + ")");
        }
    }
}

function DistanceListHandle(value) {
    gameMode.SetDistanceMode(parseInt(value));
    aim = new Aim();
    document.getElementById("distanceSelector").blur();
}

