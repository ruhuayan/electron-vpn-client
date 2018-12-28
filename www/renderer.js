const { remote } = require('electron');
const $ = require('jquery');

let cw = remote.getCurrentWindow();
var path = require('path');
// var fs = require('fs');
const powershell = require('node-powershell');
const ps = new powershell({
    executionPolicy: 'Bypass',
    noProfile: true
}); 
var VPN = {name: 'Rich_VPN', exist: false, status: null, address: null, location: null};   
const formSelectCountry = $('#formSelectCountry'), connectionDiv = $('.container.connection'), connectionMsg = $('#connectionMsg'), connectionBtn = $('#btnConnect'); 

function connect() {
    formSelectCountry.hide();
    connectionBtn.attr('disabled', 'disabled');
    connectionMsg.removeClass('hidden').html('状态： 连接 ... ');
    
    if (!VPN.exist) {
        const adminPS = new powershell({
            executionPolicy: 'Bypass',
            noProfile: true
        });
        const scriptPath = path.join(__dirname, 'scripts', 'windows_richyan.ps1'); 
        adminPS.addCommand('Start-Process powershell  " -ExecutionPolicy ByPass -File ' + scriptPath + ' -Add" -Verb runAs; exit'); 
        adminPS.invoke().then(output => {
            
            connectionMsg.html(output); 
            setTimeout(()=>{ 
                ps.addCommand(`rasdial ${VPN.name}`);
                ps.invoke().then( out => {
                    connectionMsg.html(out); 
                    checkVPNConnection(VPN.name).then( status=> {
                        if(status && status==='Connected'){
                            VPN.status = 'Connected';
                            connectionBtn.removeAttr('disabled').html('<span>断开</span>').attr("onClick", "disconnect();");
                            connectionMsg.html(JSON.stringify(VPN, null, ' '));
                        } else {
                            VPN.status = 'Disconnected'
                        }
                    }, err=>{
                        connectionMsg.html(err);
                    });
                }).catch( err=> {
                    connectionMsg.html(err);
                    ps.dispose();
                });
            }, 1000); 
            
        }).catch(err => {
            connectionMsg.html(err);
            adminPS.dispose();
        });

    }else {
        ps.addCommand(`rasdial ${VPN.name}`);
        ps.invoke().then(output => {
            connectionMsg.html(output); 
            checkVPNConnection(VPN.name).then( status=> {
                if(status && status==='Connected'){
                    VPN.status = 'Connected';
                    connectionBtn.removeAttr('disabled').html('<span>断开</span>').attr("onClick", "disconnect();");
                    connectionMsg.html(JSON.stringify(VPN, null, ' '));
                } else {
                    VPN.status = 'Disconnected'
                }
            }, err=>{
                connectionMsg.html(err);
            });
        }).catch(err => {
            connectionMsg.html(err);
            ps.dispose();
        });
    } 

};

function disconnect(callback) {
    
    const cmd = `rasdial ${VPN.name} /DISCONNECT | ConvertTo-Json -Compress`;
    ps.addCommand(cmd);
    ps.invoke().then(output => {
        
        connectionMsg.html(output);
        checkVPNConnection(VPN.name).then((status)=>{
            VPN.status = status; 
            // const msg = connectionMsg.html() + '\n';
            connectionMsg.html(JSON.stringify(VPN, null, ' '));
            connectionBtn.html('<span>连接</span>').attr("onClick", "connect()");
            formSelectCountry.show();
            
        }, err=>{ connectionMsg.html(err);});
        if(callback) callback();
    }).catch(err => {
        ps.dispose();
        console.log(err);
    });
};

$(document).ready(()=>{
    checkVPNConnection(VPN.name).then((status)=>{
        connectionBtn.removeAttr('disabled');
        if( status ){
            if(status === 'Connected'){
                VPN.status = 'Connected'; 
                formSelectCountry.hide();

                connectionBtn.html('<span>断开</span>').attr("onClick", "disconnect();");
                connectionMsg.removeClass('hidden').html(JSON.stringify(VPN, null, ' '));;
            }else{
                VPN.status = 'Disconnected'
            }
        }
    }, (err)=>{
        console.log(err);
    });
});

function checkVPNConnection(vpn_name){
    return new Promise((resolve, reject)=>{ 
        
        ps.addCommand("Get-VPNConnection | Select-Object @{Name='Name'; Expr={$_.Name}}, @{Name='Address'; Expr={$_.ServerAddress}}, @{Name='Status'; Expr={$_.ConnectionStatus}} | ConvertTo-Json -Compress");
      
        ps.invoke().then(output => {  //console.log(output);
            if(output){
                const vpn = JSON.parse(output);
                if(vpn.length) {
                    JSON.parse(output).map((v)=>{
                        if(v.Name === vpn_name){
                            VPN.address = v.Address;
                            VPN.exist = true;
                            resolve(v.Status);
                        }
                    });
                } else if (vpn.Name === vpn_name) {
                    VPN.address = vpn.Address;
                    VPN.exist = true;
                    resolve(vpn.Status);
                }
            }
            resolve(null);
        }).catch(err => {
            ps.dispose();
            reject(err);
        });
    });
}

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
function winClose() {
    disconnect(()=>{
        cw.close();
    });
}
