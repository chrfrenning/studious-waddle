window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 500;

    class InputHandler{
        constructor(player) {
            document.addEventListener('keydown', (event) => {
                switch(event.keyCode) {
                    case 37: // Left arrow key
                        player.speedX = -1;
                        player.speedY = 0;
                        break;
                    case 38: // Up arrow key
                        player.speedY = -1;
                        player.speedX = 0;
                        break;
                    case 39: // Right arrow key
                        player.speedX = 1;
                        player.speedY = 0;
                        break;
                    case 40: // Down arrow key
                        player.speedY = 1;
                        player.speedX = 0;
                        break;
                }
            });
        }
    }

    class v {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        
        add(r) {
            return new v(this.x + r.x, this.y + r.y);
        }
    }

    const north = new v(0, -1);
    const south = new v(0, 1);
    const east = new v(1, 0);
    const west = new v(-1, 0);

    class Projectile {

    }

    class Particle {

    }

    class Player {
            constructor(game){
                this.game = game;
                this.width = 20;
                this.height = 20;
                this.x = 0;
                this.y = 0; 
                this.speedY = 0;
                this.speedX = 0;
            }
            update(){
                if (this.game.world.map[this.x + this.speedX][this.y + this.speedY] === 1) {
                    this.speedX = 0;
                    this.speedY = 0;
                }

                this.y += this.speedY;
                this.x += this.speedX;
            }
            draw(context){
                context.fillStyle = 'green';
                context.fillRect(this.x * 20, this.y * 20, this.width, this.height);
            }
    }

    class Enemy {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 20;
            this.height = 20;
            this.velocity = new v(0, 0);
        }

        update() {
            // prefer moving in the same direction
            // if there is other options, randomly choose with low prob
            // avoid turning back unless only option
            // speedX,Y is a vector with direction and speed
            if (this.game.world.map[this.x + this.velocity.x][this.y + this.velocity.y] === 1) {
                this.velocity = new v(0,0);
            }

            let pdirs = [];
            let cp = new v(this.x, this.y);
            // check current direction
            if ( !this.game.world.isWall( cp.add(this.velocity) ) ) {
                pdirs.push( this.velocity );
                pdirs.push( this.velocity );
                pdirs.push( this.velocity );
                pdirs.push( this.velocity );
                pdirs.push( this.velocity ); // naively increased chances of continuing in same direction
            }
            // check north
            if (!this.game.world.isWall( cp.add(north)))
                pdirs.push(north);
            if (!this.game.world.isWall( cp.add(south)))
                pdirs.push(south);
            if (!this.game.world.isWall( cp.add(west)))
                pdirs.push(west);
            if (!this.game.world.isWall( cp.add(east)))
                pdirs.push(east);
            // now there's double chance for continuing in same dir
            this.velocity = pdirs[ Math.floor(Math.random() * pdirs.length) ];

            this.x += this.velocity.x;
            this.y += this.velocity.y;
        }

        draw(context) {
            context.fillStyle = 'red';
            context.fillRect(this.x * 20, this.y * 20, this.width, this.height);
        }
    }

    class Layer{

    }

    class Background{

    }

    class UI {

    }

    class World {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.map = new Array(width).fill().map(() => new Array(height).fill());
        }

        isWall(v) {
            return this.map[v.x][v.y] === 1;
        }

        update() {

        }

        draw(context) {
            // draw the walls
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    if (this.map[x][y] === 1) {
                        context.fillStyle = 'black';
                        context.fillRect(x * 20, y * 20, 20, 20);
                    }
                }
            }
        }
    }

    class Game{
        constructor(width, height){
            this.width = width;
            this.height = height;
            this.player = new Player(this);
            this.world = new World(25, 25);
            this.input = new InputHandler(this.player);
            this.enemies = [];
        }

        update(){
            this.world.update();
            this.player.update();
            this.enemies.forEach(enemy => enemy.update());
        }

        draw(context){
            this.world.draw(context);
            this.player.draw(context);
            this.enemies.forEach(enemy => enemy.draw(context));
        }

        loadLevel() {
            const image = document.getElementById('map');
            const mapcanvas = document.createElement('canvas');
            const mapctx = mapcanvas.getContext('2d');
            let mapWidth = 25;
            let mapHeight = 25;
            mapcanvas.width = mapWidth;
            mapcanvas.height = mapHeight;
            mapctx.drawImage(image, 0, 0, mapWidth, mapHeight);
            const { data } = mapctx.getImageData(0, 0, mapWidth, mapHeight);
            for (let i = 0; i < data.length; i += 4) {
                const x = (i / 4) % mapWidth;
                const y = Math.floor(i / 4 / mapWidth);
                const colorCode = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
                let mapValue;
                if (colorCode == 0x000000) {
                    mapValue = 1; // Black pixel, ie wall
                } else if (colorCode == 0xff0000) {
                    this.enemies.push( new Enemy(this, x, y) );
                } else if (colorCode == 0x00ff00) {
                    mapValue = 0; // Green pixel, player starting position
                    this.player.x = x;
                    this.player.y = y;
                } else {
                    mapValue = 0; // Other pixel colors; ignore
                }
                this.world.map[x][y] = mapValue;
                console.log(`Coordinates: (${x}, ${y}), Pixel Value: ${colorCode}`);
            }
        }
    }

    const game = new Game (canvas.width, canvas.height);
    game.loadLevel();

    function gameLoop() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update game state
        game.update();

        // Draw game
        game.draw(ctx);

        // Request next frame
        //requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    //requestAnimationFrame(gameLoop);
    function anim() {
        requestAnimationFrame(gameLoop);
    }
    this.setInterval( anim, 250 );
});