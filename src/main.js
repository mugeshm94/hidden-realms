import kaplay from "kaplay";
import "kaplay/global";

kaplay({
  scale: 0.5,
  background: [13, 140, 83],
  backgroundAudio: true,
});

// loadSprite("player", "sprites/player.png");
loadSprite("player", "sprites/detective.png", {
  sliceX: 9,
  anims: {
    idle: {
      from: 0,
      to: 0,
      speed: 5,
      loop: false,
    },
    run: {
      from: 4,
      to: 6,
      speed: 10,
      loop: false,
    },
    jump: 8,
  },
});
loadSprite("instructor", "sprites/instructor.png");
loadSprite("portal", "/sprites/portal.png");
loadSprite("grass", "/sprites/brick.png");
loadSprite("veggy", "/sprites/grass_two.png");
loadSprite("ghost", "/sprites/ghosty.png");
loadSprite("door", "/sprites/door.png");
loadSprite("key", "/sprites/key.png");
loadSound("score", "/examples/sounds/score.mp3");
loadSound("won", "/examples/sounds/won.mp3");
loadSound("weak", "/examples/sounds/weak.mp3");
loadSound("portalsound", "/examples/sounds/portal.mp3");
loadSound("backgroundaudio", "/examples/sounds/background.mp3");

play("backgroundaudio", {
  loop: true,
  paused: false,
});

volume(0.5);

function patrol(speed = 100, dir = 1) {
  return {
    id: "patrol",
    require: ["pos", "area"],
    add() {
      this.on("collide", (obj, col) => {
        if (col.isLeft() || col.isRight()) {
          dir = -dir;
        }
      });
    },
    update() {
      this.move(speed * dir, 0);
    },
  };
}

// handle usePostEffect using variable
let effectEnabled = false;

const effects = {
  light: (playerPos = vec2(0, 0)) => ({
    u_radius: 6,
    u_blur: 64,
    u_resolution: vec2(width(), height()),
    u_mouse: playerPos.add(60, 60),
    u_center: playerPos.add(60, 60),
  }),
};
for (const effect in effects) {
  loadShaderURL(effect, null, `/examples/shaders/${effect}.frag`);
}
scene("main", async (levelIdx) => {
  const SPEED = 520;

  // level layouts
  const levels = [
    [
      "====================",
      "=@                ^=",
      "=                  =",
      "=#####        #####=",
      "=#####         ####=",
      "=####   #    #  ###=",
      "=^          &      =",
      "=                  =",
      "=     ######      ^=",
      "=      #####       =",
      "=     #####        =",
      "=                  =",
      "=^             ####=",
      "=                  =",
      "=       ####       =",
      "=     & #  #      ^=",
      "=       ####       =",
      "=                  =",
      "=                  =",
      "=^    ###          =",
      "=    #####        |=",
      "====================",
    ],
    [
      "====================",
      "=@                ^=",
      "=                  =",
      "=      ######      =",
      "=    ##      ##    =",
      "=   ##  ^#    ##   =",
      "=^   #        #    =",
      "=     #      #     =",
      "=      #    #     ^=",
      "=&                 =",
      "=####           ###=",
      "=               ###=",
      "=^                 =",
      "=       ####       =",
      "=     &##  ##     ^=",
      "=       ####       =",
      "=           &      =",
      "=                  =",
      "=                 |=",
      "====================",
    ],
    [
      "====================",
      "=@                 =",
      "=      ^    ^      =",
      "=     #      #     =",
      "=    #        #    =",
      "=   #     &    #   =",
      "=   #          #   =",
      "=    #        #    =",
      "=     #      #     =",
      "=      #  ^ #      =",
      "=       #  #       =",
      "=   &    ##    &   =",
      "=        ##        =",
      "=       #  #       =",
      "=      #    #      =",
      "=     #      #     =",
      "=  ^ #        #    =",
      "=                  =",
      "=      ^   ^      |=",
      "====================",
    ],
  ];

  const level = addLevel(levels[levelIdx], {
    tileWidth: 64,
    tileHeight: 64,
    pos: vec2(64, 64),
    tiles: {
      "=": () => [
        sprite("grass"),
        area(),
        body({ isStatic: true }),
        anchor("center"),
      ],
      "@": () => [sprite("player"), area(), body(), anchor("center"), "player"],
      "|": () => [
        sprite("portal"),
        area(),
        body({ isStatic: true }),
        anchor("center"),
        "portal",
      ],
      "^": () => [
        sprite("key"),
        area(),
        body({ isStatic: true }),
        anchor("center"),
        "key",
      ],
      "&": () => [
        sprite("ghost"),
        area(),
        body({ isStatic: true }),
        anchor("center"),
        patrol(),
        "ghost",
      ],
      "#": () => [
        sprite("veggy"),
        area(),
        body({ isStatic: true }),
        anchor("center"),
      ],
    },
  });
  const player = level.get("player")[0];
  const dirs = {
    left: LEFT,
    right: RIGHT,
    up: UP,
    down: DOWN,
  };
  let collectedKeys = 0;

  const keysLabel = add([text(collectedKeys), pos(0, 0), fixed()]);
  function addDialog() {
    const h = 160;
    const pad = 16;
    const bg = add([
      pos(0, height() - h),
      rect(width(), h),
      color(0, 0, 0),
      z(100),
    ]);
    const txt = add([
      text("", {
        width: width(),
      }),
      pos(0 + pad, height() - h + pad),
      z(100),
    ]);
    bg.hidden = true;
    txt.hidden = true;
    return {
      say(t) {
        txt.text = t;
        bg.hidden = false;
        txt.hidden = false;
      },
      dismiss() {
        if (!this.active()) {
          return;
        }
        txt.text = "";
        bg.hidden = true;
        txt.hidden = true;
      },
      active() {
        return !bg.hidden;
      },
      destroy() {
        bg.destroy();
        txt.destroy();
      },
    };
  }

  const dialog = addDialog();

  for (const dir in dirs) {
    onKeyPress(dir, () => {
      dialog.dismiss();
    });
    onKeyDown(dir, () => {
      if (dir == "left") {
        player.flipX = true;
      } else if (dir == "right") {
        player.flipX = false;
      }
      player.move(dirs[dir].scale(SPEED));
      if (["left", "right"].includes(dir)) {
        player.play("run");
      } else {
        player.play("idle");
      }
    });
    onKeyRelease(dir, () => {
      player.play("idle");
    });
  }
  player.onCollide("ghost", (ghost) => {
    play("weak");
    go("main", levelIdx);
  });
  player.onCollide("key", (key) => {
    destroy(key);
    play("score");
    collectedKeys += 1;
    keysLabel.text = collectedKeys;
  });

  player.onCollide("portal", () => {
    if (collectedKeys >= 1) {
      if (levelIdx + 1 < levels.length) {
        play("portalsound");
        go("main", levelIdx + 1);
      } else {
        effectEnabled = false;
        play("won");
        go("win", 0);
        console.log("effectEnabledeffectEnabled");
      }
    } else {
      dialog.say("collect all the keys!");
    }
  });

  onUpdate(() => {
    const effect = Object.keys(effects)[0];
    // Enable at the end
    console.log(effectEnabled, "effectEnabled");
    effectEnabled && usePostEffect("light", effects[effect](player.pos));
  });
  //   player.onPhysicsResolve(() => {
  //     // Set the viewport center to player.pos
  //     camPos(player.pos);
  //   });
  //   player.onUpdate(() => {
  //     // center camera to player
  //     camPos(player.pos);
  //   });

  onKeyPress("f", () => {
    setFullscreen(!isFullscreen());
  });
});

const DEF_COUNT = 180;
const DEF_GRAVITY = 800;
const DEF_AIR_DRAG = 0.9;
const DEF_VELOCITY = [1000, 4000];
const DEF_ANGULAR_VELOCITY = [-200, 200];
const DEF_FADE = 0.3;
const DEF_SPREAD = 60;
const DEF_SPIN = [2, 8];
const DEF_SATURATION = 0.7;
const DEF_LIGHTNESS = 0.6;

function addConfetti(opt = {}) {
  const sample = (s) => (typeof s === "function" ? s() : s);
  for (let i = 0; i < (opt.count ?? DEF_COUNT); i++) {
    const p = add([
      pos(sample(opt.pos ?? vec2(0, 0))),
      choose([rect(rand(5, 20), rand(5, 20)), circle(rand(3, 10))]),
      color(
        sample(opt.color ?? hsl2rgb(rand(0, 1), DEF_SATURATION, DEF_LIGHTNESS))
      ),
      opacity(1),
      lifespan(4),
      scale(1),
      anchor("center"),
      rotate(rand(0, 360)),
    ]);
    const spin = rand(DEF_SPIN[0], DEF_SPIN[1]);
    const gravity = opt.gravity ?? DEF_GRAVITY;
    const airDrag = opt.airDrag ?? DEF_AIR_DRAG;
    const heading = sample(opt.heading ?? 0) - 90;
    const spread = opt.spread ?? DEF_SPREAD;
    const head = heading + rand(-spread / 2, spread / 2);
    const fade = opt.fade ?? DEF_FADE;
    const vel = sample(opt.velocity ?? rand(DEF_VELOCITY[0], DEF_VELOCITY[1]));
    let velX = Math.cos(deg2rad(head)) * vel;
    let velY = Math.sin(deg2rad(head)) * vel;
    const velA = sample(
      opt.angularVelocity ??
        rand(DEF_ANGULAR_VELOCITY[0], DEF_ANGULAR_VELOCITY[1])
    );
    p.onUpdate(() => {
      velY += gravity * dt();
      p.pos.x += velX * dt();
      p.pos.y += velY * dt();
      p.angle += velA * dt();
      p.opacity -= fade * dt();
      velX *= airDrag;
      velY *= airDrag;
      p.scale.x = wave(-1, 1, time() * spin);
    });
  }
}

scene("win", () => {
  const facts = [
    "Traces of birch bark tar, believed to be the world's oldest chewing gum,  were found in Finland dating back over 9,000 years.  Apparently, our ancestors enjoyed a good chew too!",
    "Despite all the proposed explanations, the exact cause of hiccups remains a scientific mystery.  They're usually harmless and short-lived, but can be quite annoying!",
    "While dreams can be very vivid and involve sounds,  the actual dreaming process is silent.  Any sounds you perceive are created by your brain after you wake up.",
    "Believe it or not, the world's largest living organism isn't an animal, but a fungus!  The humongous fungus covers over 2,000 acres of forest in Oregon.",
    "There are actually different cloud types classified by their shape and altitude.  Next time you're gazing at the sky, see if you can identify any cirrus, cumulus, or stratus clouds!",
    "Ever notice how a yawn from one person can make others yawn too?  Scientists believe it's a social signal promoting empathy and group cohesion.",
    "Gold is one of the most malleable elements, meaning it can be hammered into thin sheets without breaking.  This property makes it ideal for jewelry and other decorative items.",
    "The world's population is constantly growing, with estimates suggesting it will reach around 8 billion people by the end of 2024.",
    "Koalas have very similar ridged patterns on their paws as humans do on their fingers.  Unfortunately, this wouldn't hold up in a courtroom (koala court presumably being much more chill).",
    "The population of the Earth is about the same as the number of chickens.  That's a lot of clucking around!",
    "Butterflies taste with their feet.  Imagine tiny taste buds on tiny little feet!",
    "Dolphins give each other names by whistling.  Scientists believe these whistles are unique identifiers for each dolphin.",
    "A group of owls is called a parliament.  Apparently, owls are very wise... and apparently very fond of debate?",
    "According to a survey, 41% of Americans believe Bigfoot is real.  There you have it, folks - more people believe in Bigfoot than can correctly identify it on a map.",
  ];
  addConfetti(pos(center().x, center().y));
  effectEnabled = false;
  usePostEffect(null);
  add([
    text("Know a Fact", { color: rgb(0, 1, 1) }),
    pos(width() / 2, height() / 2),
    anchor("center"),
  ]);
  const randomIndex = Math.floor(Math.random() * facts.length);
  add([
    text(facts[randomIndex], {
      size: 32,
      width: 700, // Width of the text block
      height: 400, // Height of the text block
      color: rgb(1, 0, 0),
    }),
    pos(width() / 2, height() / 2 + 150),
    anchor("center"),
  ]);
  onKeyPress(() => go("menu"));
});

function addButton(txt, p, f) {
  const btn = add([
    rect(180, 130, { radius: 8 }),
    pos(p),
    area(),
    scale(1),
    anchor("center"),
    outline(4),
  ]);

  btn.add([text(txt), anchor("center"), color(0, 0, 0)]);
  btn.onHoverUpdate(() => {
    const t = time() * 10;
    btn.color = hsl2rgb((t / 10) % 1, 0.6, 0.7);
    btn.scale = vec2(1.2);
    setCursor("pointer");
  });

  btn.onHoverEnd(() => {
    btn.scale = vec2(1);
    btn.color = rgb();
  });
  btn.onClick(f);
  return btn;
}

scene("menu", () => {
  addButton("Start", vec2(width() / 2, height() / 2 + 100), () => {
    go("dialog", 0);
  });
  add([
    text("Hidden Realms"),
    pos(width() / 2, height() / 2),
    anchor("center"),
  ]);
  //   onKeyPress(() => go("main", 0));
});

scene("dialog", () => {
  // Define the dialogue data
  const dialogs = [
    ["instructor", "Discover hidden facts in a mysterious realm.!"],
    ["instructor", "Collect 6 keys 🔑 to unlock the portal."],
    ["instructor", "Beware of ghosts 👻 that reset your progress!"],
    ["instructor", "Navigate through stone walls and grass barriers."],
    ["instructor", "Your light is your guide in the darkness."],
    ["instructor", "Complete all levels to know the real fact."],
  ];

  let curDialog = 0;

  // Text bubble
  const textbox = add([
    rect(width() - 200, 120, { radius: 32 }),
    anchor("center"),
    pos(center().x, height() - 100),
    outline(4),
  ]);

  // Text
  const txt = add([
    text("", { size: 32, width: width() - 230, align: "center" }),
    pos(textbox.pos),
    anchor("center"),
    color(0, 0, 0),
  ]);

  // Character avatar
  const avatar = add([
    sprite("instructor"),
    scale(1.55),
    anchor("center"),
    pos(180, height() - 100),
  ]);

  onKeyPress("space", () => {
    // Cycle through the dialogs
    curDialog = curDialog + 1;
    updateDialog();
  });
  onMousePress(() => {
    // Cycle through the dialogs
    curDialog = curDialog + 1;
    updateDialog();
  });
  // Update the on screen sprite & text
  function updateDialog() {
    console.log(curDialog, "curDialog");
    if (curDialog > 4) {
      go("main", 0);
      effectEnabled = true;
    } else {
      const [char, dialog] = dialogs[curDialog];
      avatar.use(sprite(char));
      txt.text = dialog;
    }
  }

  updateDialog();
});

go("menu", 0);
