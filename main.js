const express = require('express');
const app_m = express();
const axios = require('axios').default;
const { proxy, scriptUrl } = require('rtsp-relay')(app_m);

// var ip = require('ip');
var spawn = require('child_process').spawn;

const fs = require('fs');
const path = require('path');
//decrypted password camera 


var cmd = 'ffmpeg';
var p_list = [];
var p_list_record = [];

const cors = require('cors');

const app = express();
app.use(cors());


app.use('/stream', express.static(path.join(__dirname, 'streaming/')))
app.use(express.static('public'));

var urlCamera_data  = {
  'id':[],
  'id_streamer':[],
  'nama':[],
  'url':[],
  'url_cam':[],
  'active':[],
  'protokol':[],
  'args':[],
  'record_args':[],
  // 'url_cam':[],
};





var WebSocketServer = require('websocket').server;
var http = require('http');
var list_client_ws = [];
var ip_data ='localhost';

//codingan untuk websocket

var server = http.createServer(function (request, response) {
  console.log('ada request ke '+request.url);
  response.write('alhamdulillah');
  response.end();
});

server.listen(8085,function () {
  console.log('server Camera Single View websocket berjalan di port 8085');
});

function originDiizinkan(origin) {
  return true;
}

serverWS = new WebSocketServer({
  httpServer: server,
  autoAcceptConnection: false,
});


serverWS.on('request',function (request) {
  if (!originDiizinkan(request.origin)) {
      console.log('koneksi dari '+request.origin+' ditolak');
    
      request.reject();
      return;
  }
  console.log('koneksi dari '+request.origin+' diterima');
  refesh_camera_data();
  cek_data(urlCamera_data);
  var koneksi = request.accept(null,request.origin);
  var list_client_ws_index = list_client_ws.push(koneksi) - 1;
  var command_cam = '';
  var massage_from_ws = '';

  app.get("/tes", (req, res) => {
    res.json({ message: "Ohayou Gozaimasu 😘" });
});


  //jika mendapatkan koneksi websocket
  koneksi.on('message',function(message) {
      if (message.type==='utf8') {
          console.log('diterima: '+message.utf8Data+'\ndari: '+request.origin);
          console.log(message.utf8Data);
          massage_from_ws = message.utf8Data;
          if (massage_from_ws == 'refresh_cam') {
            refesh_camera_data();
          }
          // /Show_CameraID/1
          console.log('line 83 show camera');

          if (massage_from_ws.includes('ws_ping')) {
            
          }

          if (massage_from_ws.includes('show_cameraID')) { 
              console.log('line 89 show camera');
              command_cam = massage_from_ws.split('/');
              console.log(command_cam);
              console.log('show_camera',command_cam[1]);
              let id_cam_ws = command_cam[1];
              console.log('AAAA :',urlCamera_data.args[id_cam_ws]);
              let folder_name = 'streaming/cam_id_'+urlCamera_data.id[id_cam_ws]+'';
              fs.mkdir(path.join(__dirname,folder_name), (err) => {
                if (active_cam.includes(id_cam_ws)) {
                  console.log('true');
                return;
                }
              
                if (err) {
                    let error = console.error(err.code);
                    fs.readdir(folder_name, (err, files) => {
                      if (err) throw err;
                      for (const file of files) {
                        // if (file.includes('.ts') ) {  
                            console.log(file);
                            fs.unlink(path.join(folder_name, file), (err) => {
                              if (err) throw err;
                            });
                        // }
                      }
                    });

                    if (error ='EEXIST') {
                      child_process_camera(urlCamera_data.args[id_cam_ws],id_cam_ws);
                     return  console.log('Directory did not created successfully!');
                    }
                }
                child_process_camera(urlCamera_data.args[id_cam_ws],id_cam_ws);
                console.log('Directory created successfully!');
            });
              
              // child_process_camera(urlCamera_data.args[id_cam_ws],id_cam_ws);

          }

          //todo menghubungkan ffmpeg dengan fs

          if (massage_from_ws.includes('record_cameraID')) { 

              command_cam = massage_from_ws.split('/');
              console.log(command_cam);
              console.log('show_camera',command_cam[1]);
              let id_cam_ws = command_cam[1];
              console.log(urlCamera_data.record_args[id_cam_ws]);
             
            
              child_process_record(urlCamera_data.record_args[id_cam_ws],id_cam_ws);

          }

          if (massage_from_ws.includes('stop_record_cameraID')) { 

              command_cam = massage_from_ws.split('/');
              console.log(command_cam);
              console.log('show_camera',command_cam[1]);
              let id_cam_ws = command_cam[1];
              console.log(urlCamera_data.record_args[id_cam_ws]);
             
            
              stop_record(id_cam_ws);

          }

       
      }



  });


  koneksi.on('close',function (reasonCode,description) {
      console.log('koneksi '+koneksi.remoteAddress+' terputus karena '+description);
      // kalau terputus ntar langsung kirim mqtt deactive monitoring
      var i = list_client_ws.indexOf(koneksi);
      list_client_ws.splice(i,1);

      console.log(list_client_ws.length);
        if (list_client_ws.length == 0 ) {
          let websocket_length = list_client_ws.length;
          websocket_timeout(websocket_length);
        }

  });
});




function websocket_timeout(websocket_length) {
  let time = 1000*3600;
  setTimeout(() => {
    console.log('-------------------------------------------------');
    console.log('test')
    if ( list_client_ws.length == 0 ) {
      console.log('Kill Kamera karena tidak ada koneksi websocket yang terhubung:', list_client_ws.length);
      kill_process_live()
      return;
    } 
  
  }, time);
  
}



refesh_camera_data();
 function refesh_camera_data() {

  axios.get('http://localhost/beacukai_camera/api/IPcamera/')
  .then(function (response) {
    urlCamera_data  = {
      'id':[],
      'id_streamer':[],
      'nama':[],
      'url':[],
      'url_cam':[],
      'active':[],
      'protokol':[],
      'args':[],
      'record_args':[],
    };
    
  
    var urlCamera = response.data;

    
    for (let i = 0; i < urlCamera.length; i++) {
  
      let id_camera = urlCamera[i].id;
      let nama = urlCamera[i].name;
      let url = urlCamera[i].url;
      let streamer_id = urlCamera[i].streamer_id;

      if (urlCamera_data.id.includes(id_camera)) {

        
        //if ip_data include in urlCamera_data.url_cam
        if (urlCamera_data.url_cam.includes(ip_data)) {
           console.log('Ganti ip');
        }

      }else{
        urlCamera_data.id.push(id_camera);
        urlCamera_data.id_streamer.push(streamer_id);
        urlCamera_data.nama.push(nama);
        urlCamera_data.url.push(url);
        if (urlCamera_data.url_cam.includes(ip_data)) {
          console.log('Ganti ip');
        }
       
        let argss = RTSP_protocol(id_camera,url);
        let record_args = RTSP_protocol_record(id_camera,url);
 
        urlCamera_data.args.push(argss);
        urlCamera_data.record_args.push(record_args);


      }

       
      
    }
  
  });

  console.log('refesh data');
  //publis ws
  for (let i = 0; i < list_client_ws.length; i++) {
    list_client_ws[i].send('Camera_data_refresh');
  }

}



function cek_data(data) {
  console.log(data);
  console.log('Data Refreshed');
  console.log('-------------------------------------');
}



//rtsp to HLS PRotokol 
// ffmpeg -loglevel debug -rtsp_transport tcp -i "3454/Media/Live/Normal?camera=C_2&streamindex=1"    -vcodec libx264 -r 25 -b:v 1000000 -crf 31 -acodec aac  -sc_threshold 0 -f hls  -hls_time 5  -segment_time 5 -hls_list_size 5  -hls_delete_threshold 3 -hls_flags delete_segments stream.m3u8
function RTSP_protocol(id,url) {
    var args = [
        '-loglevel','verbose', 
        '-rtsp_transport','tcp',
         '-i',''+url+'', 
         '-ss','00:00:59.435','-frames','1','streaming/cam_id_'+id+'/output.jpg',
        '-vcodec','libx264', 
        '-r','25',
        // 'scale=1000:720',//ukuran
        '-preset','ultrafast', 
        '-bufsize','750k',
        '-b:v','500k', 
        // '-strftime','1',
        // '-c:a','aac', 
        '-crf','31',
        '-sc_threshold','0',
        '-f','hls',
        '-hls_time','5',
        '-segment_time','5',
        '-hls_list_size','5',  
        '-hls_delete_threshold', '3',
        // '-strftime_mkdir','1',
        // '-hls_segment_filename','%Y/%m/%d/%H-%M.ts',
        '-hls_flags','delete_segments','streaming/cam_id_'+id+'/stream_cam_'+id+'.m3u8',
        
      ]
    return args;
}




function RTSP_protocol_record(id,url) {
  // ffmpeg -loglevel debug -rtsp_transport tcp -i "3454/Media/Live/Normal?camera=C_2&streamindex=1" -f segment -segment_time 10 -segment_format mp4  -reset_timestamps 1 -strftime 1  -c copy -map 0:v foo-%Y%m%d-%H%M%S.mp4

  var args = [
    '-loglevel','verbose', 
    '-rtsp_transport','tcp',
     '-i',''+url+'', 
     '-pix_fmt','yuv420p',
     '-c:v','libx264',
    '-f','segment', 
    '-segment_time','60',
    '-segment_format','mp4',
    '-reset_timestamps','1',
    '-strftime','1', 
    '-c','copy', 
    // '-c:a','aac', 
    '-map','0:v', 
    'record/'+id+'-%Y%m%d-%H%M%S.mp4'

]

return args;

}


// Tes RTSP child


var nomor = 0;
var child=[];
var active_cam =[];
var args_c = [];
function child_process_camera(argument_data,id) {

  if (active_cam.includes(id)) {
    console.log('true');
  return;
  }

  active_cam.push(id);



    args_c.push(argument_data);

    console.log('asdad',args_c.length);

    for (var i = 0; i < args_c.length ; i++) {
        (function(i){

          if (camera_active[i] == '' || camera_active[i] == null  ) {
              // proc = spawn(cmd, args_tes);
            var args_tes = args_c[i];
             child[i] = spawn(cmd, args_tes);
    
            // Add the child process to the list for tracking
            p_list.push({process:child, content:""});
    
            // Listen for any response:
            child[i].stdout.on('data', function (data) {
                // console.log(args[i][5]);
                // console.log(child.pid);
                p_list[i].content += data;
              
            });
    
            // Listen for any errors:
            child[i].stderr.on('data', function (data) {
              try {
                console.log(child[i].pid);
              } catch (error) {
                return;
              }
                // console.log(args_c[i][5]);
                p_list[i].content += data;
               
            }); 
          
            // Listen if the process closed
            child[i].on('close', function() {
                console.log('Closed before stop: Closing code: ');
            });
            console.log('kirim cmd');
            camera_active.push('True');
            console.log('array ke :',i);
            // console.log(args_c);
          }else{
            console.log(camera_active);
            console.log('tidak kirim');
            console.log('array ke :',i);
          }

          

        })(i)
    }

}


var child_record=[];
var active_cam_record =[];
var args_record = [];
var camera_active = [];
function child_process_record(argument_data,id) {

  if (active_cam_record.includes(Number(id))) {
    console.log('true');
  return;
  }

  active_cam_record.push(Number(id));

  console.log(active_cam_record);


  args_record.push(argument_data);


    // for (var i = 0; i < args_record.length ; i++) {
    //     (function(i){
          
    
            // proc = spawn(cmd, args_tes);
            // var args_tes = args_record[i];
            // child_record[i] = spawn(cmd, args_tes);
    
            // // Add the child process to the list for tracking
            // p_list_record.push({process:child_record, content:""});
    
            // // Listen for any response:
            // child_record[i].stdout.on('data', function (data) {
            //     // console.log(args[i][5]);
            //     // console.log(child.pid);
            //     p_list_record[i].content += data;
              
            // });
    
            // // Listen for any errors:
            // child_record[i].stderr.on('data', function (data) {
            //   try {
            //     console.log(child_record[i].pid);
            //   } catch (error) {
            //     return;
            //   }
            //     // console.log(args_c[i][5]);
            //     p_list_record[i].content += data;
               
            // }); 
          
            // // Listen if the process closed
            // child_record[i].on('close', function() {
            //     console.log('Closed before stop: Closing code: ');
            // });

    //     })(i)
    // }

}



    //kill child process jika websocket disconnect
    function kill_process_live() {
      for (let i = 0; i < args_c.length; i++) {
        console.log(child[i].pid);
        child[i].stdin.pause();
        // child[i].stdin.end()
        child[i].kill();
        
      }
      active_cam = [];
      camera_active = [];
      args_c = [];
      child = [];
      
    }
    
    function kill_process_record() {
      for (let i = 0; i < args_record.length; i++) {
        child_record[i].stdin.pause();
        child_record[i].kill();
        
      }
      active_cam_record = [];
      args_record = [];
      child_record = [];
      
    }


    function stop_record(id) {
      var index = '';
      if (active_cam_record.includes(Number(id))) {
          console.log('true');
          index = active_cam_record.indexOf(Number(id));
          active_cam_record.splice(index, 1);
          
          
          child_record[index].stdin.pause();
          child_record[index].kill('SIGINT');
          
          if (index > -1) { // only splice array when item is found
            active_cam_record.splice(index, 0); // 2nd parameter means remove one item only
            args_record.splice(index, 0); // 2nd parameter means remove one item only
            child_record.splice(index, 0); // 2nd parameter means remove one item only
          }

      }
      return;
    
    }
    
    app.listen(3080, function () {
      console.log('CORS-enabled web server listening on port 3080')
    })