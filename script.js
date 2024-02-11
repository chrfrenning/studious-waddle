window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 500;

    class V {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        
        add(r) {
            return new V(this.x + r.x, this.y + r.y);
        }
    }

    const north = new V(0, -1);
    const south = new V(0, 1);
    const east = new V(1, 0);
    const west = new V(-1, 0);

    const world_space = 0;
    const world_wall = 1;
    const world_candy = 2;

    class Projectile {

    }

    class Particle {

    }

    class Player {
            constructor(game) {
                this.game = game;
                this.width = 20;
                this.height = 20;
                this.x = 0;
                this.y = 0; 
                this.speedY = 0;
                this.speedX = 0;
                this.candy_eaten = 0;
                this.is_dead = false;
            }

            update() {
                // current movement blocked?
                if ( this.game.world.isWall(new V(this.x + this.speedX, this.y + this.speedY)) ) {
                    this.speedX = 0;
                    this.speedY = 0;
                }

                // standing still, but next is set?
                if ( this.speedX === 0 && this.speedY === 0 ) {
                    if ( this.next !== undefined ) {
                        this.speedX = this.next.x;
                        this.speedY = this.next.y;
                    }
                }

                // is next possible?
                if ( this.next !== undefined ) {
                    if ( !this.game.world.isWall(new V(this.x + this.next.x, this.y + this.next.y)) ) {
                        this.speedX = this.next.x;
                        this.speedY = this.next.y;
                        this.next = undefined;
                    }
                }

                this.y += this.speedY;
                this.x += this.speedX;
                let p = new V(this.x, this.y);

                // check for candy
                if ( this.game.world.isCandy(p) ) {
                    this.candy_eaten++;
                    this.game.world.map[this.x][this.y] = world_space;
                }

                // check for enemies
                this.game.enemies.forEach(enemy => {
                    if ( enemy.x === this.x && enemy.y === this.y ) {
                        this.speedX = 0;
                        this.speedY = 0;
                        this.is_dead = true;
                    }
                });
            }

            draw(context) {
                context.fillStyle = 'green';
                context.fillRect(this.x * 20, this.y * 20, this.width, this.height);
            }

            isDead() {
                return this.is_dead;
            }
    }

    class Enemy {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 20;
            this.height = 20;
            this.velocity = new V(0, 0);
        }

        update() {
            // prefer moving in the same direction
            // if there is other options, randomly choose with low prob
            // avoid turning back unless only option
            // speedX,Y is a vector with direction and speed
            if ( this.game.world.isWall(new V(this.x + this.velocity.x, this.y + this.velocity.y) ) ) {
                this.velocity = new V(0,0);
            }

            let pdirs = [];
            let cp = new V(this.x, this.y);
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

            // new position
            let p = new V(this.x, this.y);

            // check for player
            if ( this.game.player.x === this.x && this.game.player.y === this.y ) {
                this.game.player.speedX = 0;
                this.game.player.speedY = 0;
                this.game.player.is_dead = true;
            }
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
            return this.map[v.x][v.y] === world_wall;
        }

        isCandy(v) {
            return this.map[v.x][v.y] === world_candy;
        }

        update() {

        }

        draw(context) {
            const flower = document.getElementById('flower');

            // draw the walls
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    let v = new V(x, y);

                    if ( this.isWall(v) ) {
                        context.fillStyle = 'black';
                        context.fillRect(x * 20, y * 20, 20, 20);
                    } else if ( this.isCandy(v) ) {
                        // load and draw sprite_flower.png at x * 20, y * 20
                        context.drawImage(flower, x * 20, y * 20, 20, 20);
                    }
                }
            }
        }
    }

    class InputHandler{
        constructor(player) {
            document.addEventListener('keydown', (event) => {
                switch(event.keyCode) {
                    case 37: // Left arrow key
                        player.next = new V(-1, 0);
                        break;
                    case 38: // Up arrow key
                        player.next = new V(0, -1);
                        break;
                    case 39: // Right arrow key
                        player.next = new V(1, 0);
                        break;
                    case 40: // Down arrow key
                        player.next = new V(0, 1);
                        break;
                }
            });
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
                    mapValue = world_wall; // Black pixel, ie wall
                } else if (colorCode == 0xff0000) {
                    this.enemies.push( new Enemy(this, x, y) );
                } else if (colorCode == 0x00ff00) {
                    mapValue = 0; // Green pixel, player starting position
                    this.player.x = x;
                    this.player.y = y;
                } else if ( colorCode == 0xffff00 ) {
                    mapValue = world_candy; // Yellow pixel, ie candy
                }
                else {
                    mapValue = world_space; // Other pixel colors; ignore
                }
                this.world.map[x][y] = mapValue;
                console.log(`Coordinates: (${x}, ${y}), Pixel Value: ${colorCode}`);
            }
        }
    }

    const game = new Game (canvas.width, canvas.height);
    game.loadLevel();

    let start, previousTimeStamp;

    function gameLoop(ts) {
        if ( start === undefined ) {
            start = ts;
        }
        const elapsed = ts - start;
        const delta = ts - previousTimeStamp;
        previousTimeStamp = ts;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update game state
        if ( elapsed > 150 ) {
            game.update();
            start = ts;
        }

        // Draw game
        game.draw(ctx);

        // Request next frame
        if ( !game.player.isDead() )
            requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    requestAnimationFrame(gameLoop);
});