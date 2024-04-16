const axios = require('axios'); // call to fast api
const express = require('express'); // proxy api call
const bodyParser = require('body-parser');  // for larger request bodies (base64 inputs)
const multer = require('multer'); // for file uploads
const fs = require('fs'); // for returning file instead of base64 string
const path = require('path');
const { Buffer } = require('buffer'); // for b64 to file
const rateLimit = require('express-rate-limit');  // rate limiting
const fsExtra = require('fs-extra');

const app = express();
const upload = multer();
const limiter = rateLimit({
  max: 100, // how many requests in windowMs
  windowMs: 10 * 60 * 1000, // time frame (atm: 10 mins)
});

const API_BASE_URL = 'http://stable-diffusion-webui-master-proxy_server-1:7860'; // python api endpoint (docker container)
const PROXY_BASE_URL = 'http://stable-diffusion-webui-master-proxy_server-1:3000'; // proxy endpoint

app.use(express.static(path.join(__dirname, '')));
app.use(bodyParser.json({ limit: '50mb' })); // Adjust the limit as per your requirements
app.use(express.json());
app.use(limiter);
app.set('trust proxy', 1);

// Start the server
const port = 3000; // Replace with the desired port number
app.listen(port, () => {
  console.log(`Server running on ${PROXY_BASE_URL}`);
});

// Generate unique id for each image
function generateUniqueId() {
  const date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth();
  var day = date.getDate();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();
  var millisec = date.getMilliseconds();

  var unique_id = parseInt((`${year}${month}${day}${hour}${minute}${second}${millisec}`).toString());
  
  return (unique_id);
}

const clearDir = async () => {  // clear directories
  try {
    await fsExtra.emptyDir(path.join(__dirname, 'outputs/ctrlnet-images'));
    await fsExtra.emptyDir(path.join(__dirname, 'outputs/extra_batch-images'));
    await fsExtra.emptyDir(path.join(__dirname, 'outputs/extra_single-images'));
    await fsExtra.emptyDir(path.join(__dirname, 'outputs/img2img-images'));
    await fsExtra.emptyDir(path.join(__dirname, 'outputs/mov2mov-images'));
    await fsExtra.emptyDir(path.join(__dirname, 'outputs/mov2mov-videos'));
    await fsExtra.emptyDir(path.join(__dirname, 'outputs/txt2img-images'));
    
    console.log("Emptied all output directories !");
  } catch(error) {
    console.log("Error clearing output directories !");
    console.log(error);
  }
};

/*      HANDLERS FOR API METHODS -- mov2mov --> sdapi --> controlnet*/

const handleMov2MovGenerate = async (req, res) => {
  // clear dir each time the function is called 
  clearDir();

  const formData = new FormData();  // formData is used, needs to accept files

  try {
    var id_task = req.body.id_task;
    var mov2mov_prompt = req.body.mov2mov_prompt;
    var mov2mov_negative_prompt = req.body.mov2mov_negative_prompt;

    var mov2mov_input_video = req.file; // take ONE video file
    const filePath = "uploads/mov2mov_videos/generated_video.mp4"; // save uploaded video to /uploads (rewritten each time)
    const savePath = path.join(__dirname, filePath);
    fs.writeFileSync(savePath, mov2mov_input_video.buffer); // file.buffer to mp4
    const tempVid = fs.readFileSync(savePath);
    let blob = new Blob([tempVid], {type: 'video/*'});  // appended to formData

    var steps = parseInt(req.body.steps); // parse as integer
    var sampler_index = parseInt(req.body.sampler_index);
    var restore_faces = req.body.restore_faces;
    var tiling = req.body.tiling;
    var modnet_enable = req.body.modnet_enable;
    var modnet_background = req.body.modnet_background;
    var modnet_background_movie = req.body.modnet_background_movie;
    var modnet_model = req.body.modnet_model;
    var modnet_resize_mode = parseInt(req.body.modnet_resize_mode);
    var modnet_merge_background_mode = parseInt(req.body.modnet_merge_background_mode);
    var modnet_movie_frames = parseInt(req.body.modnet_movie_frames);
    var generate_mov_mode = parseInt(req.body.generate_mov_mode);
    var noise_multiplier = parseFloat(req.body.noise_multiplier);
    var cfg_scale = parseFloat(req.body.cfg_scale);
    var image_cfg_scale = parseFloat(req.body.image_cfg_scale);
    var denoising_strength = parseFloat(req.body.denoising_strength);
    var movie_frames = parseInt(req.body.movie_frames);
    var max_frames = parseInt(req.body.max_frames);
    var seed = parseInt(req.body.seed);
    var subseed = parseInt(req.body.subseed);
    var seed_resize_from_h = parseInt(req.body.seed_resize_from_h);
    var seed_resize_from_w = parseInt(req.body.seed_resize_from_w);
    var seed_enable_extras = req.body.seed_enable_extras;
    var height = parseInt(req.body.height);
    var width = parseInt(req.body.width);
    var resize_mode = parseInt(req.body.resize_mode);
    var override_settings_text = req.body.override_settings_text;
    var args = req.body.args;

    formData.append("id_task", id_task);
    formData.append("mov2mov_prompt", mov2mov_prompt);
    formData.append("mov2mov_negative_prompt", mov2mov_negative_prompt);
    formData.append("mov2mov_input_video", blob, mov2mov_input_video.fieldname);
    formData.append("steps", steps);
    formData.append("sampler_index", sampler_index);
    formData.append("restore_faces", restore_faces);
    formData.append("tiling", tiling);
    formData.append("modnet_enable", modnet_enable);
    formData.append("modnet_background", modnet_background);
    formData.append("modnet_background_movie", modnet_background_movie);
    formData.append("modnet_model", modnet_model);
    formData.append("modnet_resize_mode", modnet_resize_mode);
    formData.append("modnet_merge_background_mode", modnet_merge_background_mode);
    formData.append("modnet_movie_frames", modnet_movie_frames);
    formData.append("generate_mov_mode", generate_mov_mode);
    formData.append("noise_multiplier", noise_multiplier);
    formData.append("cfg_scale", cfg_scale);
    formData.append("image_cfg_scale", image_cfg_scale);
    formData.append("denoising_strength", denoising_strength);
    formData.append("movie_frames", movie_frames);
    formData.append("max_frames", max_frames);
    formData.append("seed", seed);
    formData.append("subseed", subseed);
    formData.append("seed_resize_from_h", seed_resize_from_h);
    formData.append("seed_resize_from_w", seed_resize_from_w);
    formData.append("seed_enable_extras", seed_enable_extras);
    formData.append("height", height);
    formData.append("width", width);
    formData.append("resize_mode", resize_mode);
    formData.append("override_settings_text", override_settings_text);
    formData.append("args", args);

    // see if formData is actually taking in your request body and in the format you need
    for (var key of formData.entries()) {
      console.log(key[0] + ', ' + key[1]);
    }

    // Make a POST request to your Python API endpoint
    const response = await axios.post(`${API_BASE_URL}/mov2mov/generate`, formData);
    const { video, info } = response.data;
    const videoPath = path.join(__dirname, video);
    
    // Return the generated video file (I don't think Postman handles video streaming)
    res.sendFile(videoPath);
  } catch (error) {
    res.status(422).json(error);
    console.log(error);
  }
};

/* SD-WEBUI HANDLERS */ 
const handleTxt2Img = async (req, res) => {
  // clear dir each time the function is called 
  clearDir();

  try {
    const {
      id_task,
      prompt,
      negative_prompt,
      prompt_styles,
      steps,
      sampler_index,  // "Euler", "Euler a", etc. NOT an integer index
      restore_faces,
      tiling,
      n_iter,
      batch_size,
      cfg_scale,
      seed,
      subseed,
      subseed_strength,
      seed_resize_from_h,
      seed_resize_from_w,
      seed_enable_extras,
      height,
      width,
      enable_hr,
      denoising_strength,
      hr_scale,
      hr_upscaler,
      hr_second_pass_steps,
      hr_resize_x,
      hr_resize_y,
      hr_sampler_index,
      hr_prompt,
      hr_negative_prompt,
      override_settings_texts
      } = req.body;

    const response = await axios.post(`${API_BASE_URL}/sdapi/v1/txt2img`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  
    const imagePaths = [];

    // Save all images (batch size can be > 1)
    for (let b64Img of response.data.images) {
      const imageBuffer = Buffer.from(b64Img, 'base64');
      const imgID = generateUniqueId();
      const imgPath = path.join(__dirname, `outputs/txt2img-images/${imgID}.png`);
      fs.writeFileSync(imgPath, imageBuffer);
      imagePaths.push(imgPath);
    }

    // Send each image file separately
    for (let imgPath of imagePaths) {
      try {
        res.sendFile(imgPath);
        console.log("sent image file !");
      } catch (error) {
        console.log("error sending image file !!");
        console.log(error);
      }
    }
    console.log("----- done -----");
  } catch (error) {
    res.status(422).json(error);
    console.log(error);
  }
};

const handleImg2Img = async (req, res) => { // same as mov2mov -- type error not dict
  // clear dir each time the function is called 
  clearDir();

  try {
    const {
      id_task,                        // str
      mode,                           // int
      prompt,                         // str
      negative_prompt,                // str
      prompt_styles,                  // str array
      init_images,                    // b64 str array
      sketch, // b64 str array         
      init_img_with_mask,
      inpaint_color_sketch,
      inpaint_color_sketch_orig,
      init_img_inpaint,
      init_mask_inpaint,
      steps,                          // int
      sampler_index,                  // int
      mask_blur,                      // int
      mask_alpha,                     // float
      inpainting_fill,                // bool
      restore_faces,                  // bool
      tiling,                         // bool
      n_iter,                         // int
      batch_size,                     // int
      cfg_scale,                      // float
      image_cfg_scale,                // float
      denoising_strength,             // float
      seed,                           // int
      subseed,                        // int
      subseed_strength,               // float
      seed_resize_from_h,             // int
      seed_resize_from_w,             // int
      seed_enable_extras,             // bool
      selected_scale_tab,             // int
      height,                         // int
      width,                          // int
      scale_by,                       // float
      resize_mode,                    // int
      inpaint_full_res,               // bool
      inpaint_full_res_padding,       // int
      inpainting_mask_invert,         // int
      img2img_batch_input_dir,        // str  --- the input/output dirs are set already in img2img
      img2img_batch_output_dir,       // str
      img2img_batch_inpaint_mask_dir, // str
      override_settings_texts         
    } = req.body;

    const response = await axios.post(`${API_BASE_URL}/sdapi/v1/img2img`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // save all images (batch size can be > 1)
    for (var b64Img of response.data.images) {
      var imageBuffer = Buffer.from(b64Img, "base64");  // decode base64 string through buffer
      var imgID = generateUniqueId();
      var imgPath = path.join(__dirname, `outputs/img2img-images/${imgID}.png`);
      fs.writeFileSync(imgPath, imageBuffer);
      console.log(`imgPath : ${imgPath}, imgID : ${imgID}`);
    }
    res.sendFile(imgPath);  
  } catch (error) {
    console.log(error);
    res.status(422).json(error);
  }
};

const extra_single_image_api = async (req, res) => { // takes base64, convs to img, conv back to base64
  // clear dir each time the function is called 
  clearDir();

  try {
    const {
      resize_mode,
      show_extras_results,
      gfpgan_visibility,
      codeformer_visibility,
      codeformer_weight,
      upscaling_resize,
      upscaling_resize_w,
      upscaling_resize_h,
      upscaling_crop,
      upscaler_1,
      upscaler_2,
      extras_upscaler_2_visibility,
      upscale_first,
      image
    } = req.body;

    const response = await axios.post(`${API_BASE_URL}/sdapi/v1/extra-single-image`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    var base64string = response.data.image;
    var imageBuffer = Buffer.from(base64string, "base64");
    var imgID = generateUniqueId();
    var imgPath = path.join(__dirname, `outputs/extra_single-images/${imgID}.png`);
    fs.writeFileSync(imgPath, imageBuffer);

    res.sendFile(imgPath); 
  } catch (error) {
    res.status(422).json(error);
    console.log(error);
  }
};

const extra_batch_images_api = async (req, res) => { // takes base64, convs to img, conv back to base64
  // clear dir each time the function is called 
  clearDir();

  try {
    const { 
      resize_mode,
      show_extras_results,
      gfpgan_visibility,
      codeformer_visibility,
      codeformer_weight,
      upscaling_resize,
      upscaling_resize_w,
      upscaling_resize_h,
      upscaling_crop,
      upscaler_1,
      upscaler_2,
      extras_upscaler_2_visibility,
      upscale_first,
      imageList
      } = req.body;

    const response = await axios.post(`${API_BASE_URL}/sdapi/v1/extra-batch-images`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

/*     clearDir(path.join(__dirname, 'outputs/extra_batch-images'));
    // save all images (batch size can be > 1)
    var base64string = response.data.images[0];  
    var imageBuffer = Buffer.from(base64string, "base64");
    var imgID = generateUniqueId();
    var imgPath = path.join(__dirname, `outputs/extra_batch-images/${imgID}.png`);
    fs.writeFileSync(imgPath, imageBuffer);
 */

    // save all images (batch size can be > 1)
    for (var b64Img of response.data.images) {
      var imageBuffer = Buffer.from(b64Img, "base64");  // decode base64 string through buffer
      var imgID = generateUniqueId();
      var imgPath = path.join(__dirname, `outputs/extra_batch-images/${imgID}.png`);
      fs.writeFileSync(imgPath, imageBuffer);
      console.log(`imgPath : ${imgPath}, imgID : ${imgID}`);
    }
    // return last image in array :
    res.sendFile(imgPath);  
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while processing batch images.' });
    console.log(error);
  }
};

const pnginfoapi = async (req, res) => {  //
  try {
    const { image } = req.body;

    const response = await axios.post(`${API_BASE_URL}/sdapi/v1/png-info`, { image }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { info, items } = response.data;

    res.json({ info, items });
  } catch (error) {
    res.status(422).json(error);
  }
};

const progressapi = async (req, res) => { // 
  try {
    const response = await axios.get(`${API_BASE_URL}/sdapi/v1/progress`, req.body, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    const { progress, eta_relative, state, current_image, textinfo } = response.data;

    res.json({ progress, eta_relative, state, current_image, textinfo });
  } catch (error) {
    res.status(422).json(error);
  }
};

const interrogateapi = async (req, res) => { //
  try {
    const interrogatereq = {
      image: req.body.image,
      model: req.body.model
    };

    const response = await axios.post(`${API_BASE_URL}/sdapi/v1/interrogate`, interrogatereq, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { caption } = response.data;

    res.json({ caption });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const interruptapi = async (req, res) => { //
  try {
    await axios.post(`${API_BASE_URL}/sdapi/v1/interrupt`);

    res.json({});
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while interrupting the API.' });
  }
};

const unloadapi = async (req, res) => {
  try {
    await axios.post(`${API_BASE_URL}/sdapi/v1/unload-checkpoint`);

    res.json({});
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while unloading the API.' });
  }
};

const reloadapi = async (req, res) => {
  try {
    await axios.post('${API_BASE_URL}/sdapi/v1/reload-checkpoint');

    res.json({});
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while reloading the API.' });
  }
};

const skip = async (req, res) => {
  try {
    await axios.post(`${API_BASE_URL}/sdapi/v1/skip`);

    res.json({});
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while skipping.' });
  }
};

const get_config = async (req, res) => {  // THIS ONE WONT FUCKING WORK
  try {
    const response = await axios.get(`${API_BASE_URL}/sdapi/v1/options`);

    const options = response.data;

    res.json(options);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving the configuration.' });
  }
};

const set_config = async (req, res) => {
  try {
    await axios.post(`${API_BASE_URL}/sdapi/v1/options`, req.body);

    res.json({});
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while setting the configuration.' });
  }
};

const get_cmd_flags = async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sdapi/v1/cmd-flags`);

    const cmdFlags = response.data;

    res.json(cmdFlags);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving the command flags.' });
  }
};

const get_samplers = async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sdapi/v1/samplers`);

    const samplers = response.data;

    res.json(samplers);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving the samplers.' });
  }
};

/*      ADD ROUTES        */

// parameter 2 takes in the video from postman
app.post('/mov2mov/generate', upload.single('mov2mov_input_video'), handleMov2MovGenerate);
app.post('/sdapi/v1/txt2img', handleTxt2Img);
app.post('/sdapi/v1/img2img', handleImg2Img);

app.post('/sdapi/v1/extra-single-image', extra_single_image_api);
app.post('/sdapi/v1/extra-batch-images', extra_batch_images_api);

app.post('/sdapi/v1/png-info', pnginfoapi);
app.get('/sdapi/v1/progress', progressapi);
app.post('/sdapi/v1/interrogate', interrogateapi);
app.post('/sdapi/v1/interrupt', interruptapi);
app.post('/sdapi/v1/unload', unloadapi);
app.post('/sdapi/v1/reload', reloadapi);
app.post('/sdapi/v1/skip', skip);
app.get('/sdapi/v1/options', get_config);
app.post('/sdapi/v1/options', set_config);
app.get('/sdapi/v1/cmd-flags', get_cmd_flags);
app.get('/sdapi/v1/samplers', get_samplers);
app.get('/sdapi/v1/upscalers', get_upscalers);