function substring(string, start, end) {
	if (end < 0) end = string.length + end;
	return string.substring(start, end);
}

const preset_list = document.getElementById("preset_list");
const icon_priority = document.getElementById("icon_priority");
const icon_glitch = document.getElementById("icon_glitch");
const bg_color = document.getElementById("bg_color");
const color = document.getElementById("color");
const name = document.getElementById("name");
const text = document.getElementById("text");
const render = document.getElementById("render");

const bg = document.createElement("img");
const dialog_shape = document.createElement("img");
const hero_icon_img = document.createElement("img");
const hero_icon_glitch_img = document.createElement("img");

const offsets = {
	width: 0,
	x: 0,
	y: 0
};

const presets = [];
class Preset {
	display_name = "";
	name = {
		position: {
			x: 0,
			y: 0
		},
		font_size: 0,
		baseline: "top",
		max_width: Infinity
	};
	icon = {
		position: {
			x: 0,
			y: 0
		},
		size: {
			width: 0,
			height: 0
		}
	};
	text = {
		position: {
			x: 0,
			y: 0
		},
		size: {
			width: 0,
			height: 0
		},
		font_size: 0
	}
	background_url = "";
	shape_url = "";

	constructor(display_name, {
		name = {
			position: {
				x: 0,
				y: 0
			},
			font_size: 0,
			baseline: "top",
			max_width: Infinity
		},
		icon = {
			position: {
				x: 0,
				y: 0
			},
			size: {
				width: 0,
				height: 0
			}
		},
		text = {
			position: {
				x: 0,
				y: 0
			},
			size: {
				width: 0,
				height: 0
			},
			font_size: 0
		},
		background_url = "",
		shape_url = ""
	}) {
		this.display_name = display_name;
		this.name = name;
		this.icon = icon;
		this.text = text;
		this.background_url = background_url;
		this.shape_url = shape_url;
	}
}

const Hero = new Preset("Hero", {
	name: {
		position: {
			x: 25,
			y: 90
		},
		font_size: 75,
		baseline: "bottom",
		max_width: 465
	},
	icon: {
		position: {
			x: 19,
			y: 116
		},
		size: {
			width: 184,
			height: 184
		}
	},
	text: {
		position: {
			x: 19 + 184,
			y: 89
		},
		size: {
			width: 1550,
			height: 345
		},
		font_size: 70
	},
	background_url: "Hero_BG.png",
	shape_url: "Hero_Shape.png"
});
presets.push(Hero);

const OE = new Preset("Octo Expansion", {
	name: {
		position: {
			x: 183,
			y: 7
		},
		font_size: 40,
		baseline: "top",
		max_width: Infinity
	},
	icon: {
		position: {
			x: 22,
			y: 22
		},
		size: {
			width: 157,
			height: 157
		}
	},
	text: {
		position: {
			x: 179,
			y: 47
		},
		size: {
			width: 827,
			height: 135
		},
		font_size: 40
	},
	background_url: "OE_BG.png",
	shape_url: "OE_Shape.png"
});
presets.push(OE);

presets.forEach(p => {
	const opt = document.createElement("option");
	opt.text = p.display_name;
	preset_list.add(opt);
});

preset_list.onchange = function () {
	bg.src = presets[this.selectedIndex].background_url;
	dialog_shape.src = presets[this.selectedIndex].shape_url;
}
preset_list.selectedIndex = 0;
preset_list.onchange();

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

function generate() {
	if (!(bg.complete && bg.naturalHeight !== 0)) return;

	canvas.width = bg.naturalWidth;
	canvas.height = bg.naturalHeight;

	const preset = presets[preset_list.selectedIndex];

	ctx.fillStyle = "transparent";
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = bg_color.value;
	ctx.fillRect(preset.icon.position.x, preset.icon.position.y, preset.icon.size.width, preset.icon.size.height);

	if(icon_glitch.value > 0) generate_glitch(preset);

	if (icon_priority.value == 0) {
		try {
			draw_icon(preset);
		} catch (e) { }
	}

	ctx.globalCompositeOperation = "destination-in";
	ctx.drawImage(dialog_shape, 0, 0);
	ctx.globalCompositeOperation = "source-over";
	ctx.drawImage(bg, 0, 0);

	if (icon_priority.value > 0) {
		try {
			draw_icon(preset);
		} catch (e) { }
	}

	let name_font_size = preset.name.font_size;
	ctx.font = `${name_font_size}px Paintball`;
	ctx.textAlign = "left";
	ctx.textBaseline = preset.name.baseline;
	ctx.fillStyle = color.value;
	let name_width = ctx.measureText(name.value).width;
	while (name_width > preset.name.max_width) {
		ctx.font = `${--name_font_size}px Paintball`;
		name_width = ctx.measureText(name.value).width;
	}
	ctx.fillText(name.value, preset.name.position.x, preset.name.position.y);

	ctx.font = `${preset.text.font_size}px Splatfont2`;
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
	ctx.fillStyle = "white";

	text.value.split("\n").forEach((line, i, lines) => {
		ctx.fillText(line,
			preset.text.position.x + preset.text.size.width / 2,
			preset.text.position.y + (i + 1) * preset.text.size.height / (lines.length + 1)
		);
	});

	render.src = canvas.toDataURL();
}

const icon_canvas = document.createElement("canvas");
const icon_ctx = icon_canvas.getContext("2d");

let fill = "transparent";
function generate_glitch(preset) {
	//if(hero_icon_glitch_img.src != "") hero_icon_img.src = hero_icon_glitch_img.src;
	const glitch_offset = parseInt(icon_glitch.value);
	const width = preset.icon.size.width + offsets.width;
	if(hero_icon_img.width == 0) return;
	const height = width * hero_icon_img.height / hero_icon_img.width;
	icon_canvas.width = width + glitch_offset * 2;
	icon_canvas.height = height;
	icon_ctx.clearRect(0, 0, icon_canvas.width, icon_canvas.height);
	icon_ctx.fillStyle = fill;
	icon_ctx.fillRect(0, 0, icon_canvas.width, icon_canvas.height);
	icon_ctx.drawImage(hero_icon_img, glitch_offset, 0, width, height);
	
	const original_data = icon_ctx.getImageData(0, 0, icon_canvas.width, icon_canvas.height).data;

	const mapped = original_data.map((v, i, a) => {
		if(i % 4 == 2) {
			let oi = i - 4 * glitch_offset;

			if(oi < 0) return v;
			return a[oi]
		}
		if(i % 4 == 1) {
			return v;
		}
		if(i % 4 == 0) {
			let x = Math.floor(i/4) % icon_canvas.width;
			let oi = i + 4 * glitch_offset;

			if(x + glitch_offset > icon_canvas.width) return v;
			return a[oi]
		}
		return v;
	}).map((v, i, a) => {
		if(i % 4 == 3) {
			return a[i - 3] + a[i - 2] + a[i - 1] == 0 ? 0 : 255;
		}
		return v;
	});

	icon_ctx.fillStyle = fill;
	icon_ctx.clearRect(0, 0, icon_canvas.width, icon_canvas.height);
	
	//icon_ctx.drawImage(hero_icon_img, glitch_offset, 0, width, height);
	icon_ctx.putImageData(new ImageData(mapped, icon_canvas.width, icon_canvas.height), 0, 0);

	hero_icon_glitch_img.src = icon_canvas.toDataURL();
}

function draw_icon(preset) {
	const width = preset.icon.size.width + offsets.width;
	const height = width * hero_icon_img.height / hero_icon_img.width;
	if(icon_glitch.value > 0 && hero_icon_glitch_img.complete && hero_icon_glitch_img.naturalHeight != 0) {	
		ctx.drawImage(hero_icon_glitch_img, preset.icon.position.x - offsets.width / 2 + offsets.x + (width - hero_icon_glitch_img.width)/2, preset.icon.position.y + offsets.y + (preset.icon.size.height - height) / 2, hero_icon_glitch_img.width, hero_icon_glitch_img.height);
		//hero_icon_img.src = hero_icon;
	} else {
		ctx.drawImage(hero_icon_img, preset.icon.position.x - offsets.width / 2 + offsets.x, preset.icon.position.y + offsets.y + (preset.icon.size.height - height) / 2, width, height);
	}
}

let hero_icon = "";
document.getElementById("icon_file").onchange = function () {
	if (hero_icon != "") try { URL.revokeObjectURL(hero_icon); } catch (e) { }
	hero_icon = URL.createObjectURL(this.files[0]);
	hero_icon_img.src = hero_icon;
}

for (const key in offsets) {
	if (offsets.hasOwnProperty(key)) {
		document.getElementById(`offset_${key}`).onchange = function () {
			offsets[key] = parseInt(this.value);
		}
	}
}

function update() {
	generate();
	requestAnimationFrame(update);
}
update();