const { remote } = require('electron');
const $ = require('jquery');

let cw = remote.getCurrentWindow();
const { spawn } = require('child_process');
var path = require('path');
// var fs = require('fs');
const powershell = require('node-powershell');
        
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

    document.getElementById('connectionWrap').classList.remove("hidden");
    const msgContainer = $('#connectionMsg');
    
    $("#btnConnect span").html("Connecting").attr('disabled', 'disabled');
    $('#formSelectCountry').hide();
    $('.container.connection').addClass('extra-wide');
    // const openvpn = spawn('C:\\Program\ Files\\OpenVPN\\bin\\openvpn.exe', ['--config', 'C:\\y\\client.ovpn']);
    
    // openvpn.stdout.on('data', (data) => {
    //     const msg = msgContainer.html() + '&#13;&#10;' + data.toString(); 
    //     msgContainer.html(msg);
    //     msgContainer.scrollTop(msgContainer[0].scrollHeight);
    // });

    // openvpn.stderr.on('data', (data) => {
    //     console.log(data.toString());
    // });

    // openvpn.on('exit', (code) => {
    //     console.log(`Child exited with code ${code}`);
    // });
    
    let ps = new powershell({
        executionPolicy: 'Bypass',
        noProfile: true
    })
    // const script = "$connections = Get-VPNConnection | Select-Object   @{Name='Name';     Expr={$_.Name}}, @{Name='Status';    Expr={$_.ConnectionStatus}}";
    // rasdial $vpn_name
    const scriptPath = path.join(__dirname, 'scripts', 'windows_richyan.ps1'); 
    // ps.addCommand('Start-Process powershell  " -ExecutionPolicy ByPass -File ' + scriptPath + ' -Add" -Verb runAs; exit'); 
    ps.addCommand('./scripts/CheckConnection');
  
    ps.invoke().then(output => {
        console.log(output)
    }).catch(err => {
        console.error(err)
        ps.dispose()
    })

    // document.getElementById("status").innerHTML = "Connected";
    // document.getElementById("btnConnect").innerHTML = "<span>Disconnect</span>";
    document.getElementById("btnConnect").setAttribute( "onClick", "javascript: disconnect();" );
};
// Invocked when disconnect function is run
function disconnect() {
    // Change status text area to Disconnecting 
    // document.getElementById("status").innerHTML = "Disconnecting";
    cw.close()
};
const containers = $('.containers');
function gotoMain(){
    containers.css({'right': '200%'});
}
function gotoLogin(){
    containers.css({'right': '100%'});
}
function gotoRegister(){
    containers.css({'right': '0'});
}
$(document).click((e)=>{
    // console.log(e)
});
