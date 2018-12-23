    const electron = require('electron');
    const BrowserWindow = electron.BrowserWindow;
    let mainWindow;
    let cw = electron.remote.getCurrentWindow()
    const { spawn } = require('child_process');
            
    function minimize() {
        cw.minimize()
    }
    function maximize() {
        if(!cw.isMaximized()){
            cw.maximize()
        }
        else{
            cw.unmaximize()
        }
    }

    // Invocked when connect function is run
    function connect() {
    // Change status text area to Loading
    document.getElementById("status").innerHTML = "Loading";
    // Change button text area to Connecting
    document.getElementById("button").textContent = "Connecting";
    const openvpn = spawn('C:\\Program\ Files\\OpenVPN\\bin\\openvpn.exe', ['--config', 'C:\\shares\\client.ovpn']);
    
    openvpn.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    openvpn.stderr.on('data', (data) => {
        console.log(data.toString());
    });

    openvpn.on('exit', (code) => {
        console.log(`Child exited with code ${code}`);
    });
    
    document.getElementById("status").innerHTML = "Connected";
    document.getElementById("button").textContent = "Disconnect";
    document.getElementById("button").setAttribute( "onClick", "javascript: disconnect();" );
    };
    // Invocked when disconnect function is run
    function disconnect() {
        // Change status text area to Disconnecting 
        document.getElementById("status").innerHTML = "Disconnecting";
        cw.close()
    };