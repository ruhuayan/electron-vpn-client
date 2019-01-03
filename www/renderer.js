const { remote } = require('electron');
const $ = require('jquery');

const cw = remote.getCurrentWindow();
const path = require('path');
// var fs = require('fs');
const powershell = require('node-powershell');
const ps = new powershell({
    executionPolicy: 'Bypass',
    noProfile: true
}); 
const VPN = {name: 'RichVPN', exist: false, status: null, address: null, location: null};   
const formSelectCountry = $('#formSelectCountry'), connectionDiv = $('.container.connection'), connectionMsg = $('#connectionMsg'), connectionBtn = $('#btnConnect'); 

function connect() {

    if(!localStorage.getItem('jwt')){
        gotoLogin();
        return;
    }else{
        formSelectCountry.hide();
        connectionBtn.attr('disabled', 'disabled');
        connectionMsg.removeClass('hidden').html('状态： 连接 ... ');

        getVPN(localStorage.getItem('jwt'))
        .done(function(result){
            if(!result || !result.script){
                connectionMsg.html('Error: no script ...');
                return;
            }
            
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

        }).fail(function(jqXHR, textStatus){
            console.log( "Request failed: " + textStatus );
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

function getVPN(jwt, location_id='montreal_1'){
    const formData = JSON.stringify({'jwt': localStorage.getItem('jwt'), 'location_id': location_id});
    return $.ajax({
        url: "https://www.richyan.com/vpn/api/vpn.php",
        method : "POST",
        contentType : 'application/json',
        data : formData
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
    // disconnect(()=>{
    //     cw.close();
    // });
    const cmd = `Remove-VpnConnection -Name ${VPN.name} -Force`;
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
}

const signupForm = document.getElementById('signupForm');

signupForm.addEventListener('blur', ( event )=> {
    if(!event.target.validity.valid){
        $(event.target).parent('.form-group').addClass('has-error');
    } else {
        $(event.target).parent('.form-group').removeClass('has-error');
    }
}, true);
signupForm.rpassword.addEventListener('input', (event)=>{
    if(signupForm.password.value !== signupForm.rpassword.value){
        signupForm.rpassword.setCustomValidity('重输密码 与密码 不对！ ');
    } else {
        signupForm.rpassword.setCustomValidity('');
    }
});
function register() {

    const formData = JSON.stringify($('#signupForm').serializeObject()); console.log(formData);
    $.ajax({
        method: "POST",
        url: 'https://www.richyan.com/vpn/api/create_user.php',
        contentType : 'application/json',
        data: formData
    }).done(function( result ) {
          console.log( result.msg );
          gotoLogin();
    }).fail(function( jqXHR, textStatus ) {
        console.log( "Request failed: " + textStatus );
    }); 
}

document.getElementById('loginForm').addEventListener('blur', ( event )=> {
    if(!event.target.validity.valid){
        $(event.target).parent('.form-group').addClass('has-error');
    } else {
        $(event.target).parent('.form-group').removeClass('has-error');
    }
}, true);
function login() {
    const formData = JSON.stringify($('#loginForm').serializeObject()); console.log(formData);
    $.ajax({
        url: "https://www.richyan.com/vpn/api/login.php",
        method : "POST",
        contentType : 'application/json',
        data : formData
    }).done(function(result){console.log(result.jwt);
         
        localStorage.setItem('jwt', result.jwt);
        gotoMain();

    }).fail(function(jqXHR, textStatus){
        console.log( "Request failed: " + textStatus );
    });
}
$.fn.serializeObject = function(){
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};