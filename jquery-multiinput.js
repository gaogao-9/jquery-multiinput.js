//サンプル
//$(document).on("multistart",function(eve){
//	console.log(eve.type);      // 押したデバイスに依存[mousedown/touchstart/pointerdown]いずれか
//	console.log(eve.multiType); // "multistart"と表示
//	console.log(eve.isMultiTouch); // (touch系イベント時 && 2本以上の指で操作してる)時にtrue、それ以外の時にfalse
//	
//	var pos = $.fn.getMultiXY(eve); // この関数もこのライブラリに入ってます。
//	console.log("page  (" + pos.pageX   + "," + pos.pageY   + ")"); // "page(x,y)"と表示
//	console.log("client(" + pos.clientX + "," + pos.clientY + ")"); // "client(x,y)"と表示
//	console.log("screen(" + pos.screenX + "," + pos.screenY + ")"); // "screen(x,y)"と表示
//	↑の3つはデバイスに依存せず常に返します。touchの場合は、changedTouches[0]を元に返します。
//	
//	依存先を変えたい場合は$.fn.getMultiXY(eve,{target:num});で、numを指定すると変えられます。
//	numが無指定もしくは0のときはchangedTouched依存
//	numが1のときはtargetTouches依存
//	numが2のときはtouches依存となっています。
//});

(function($){
	var eventsCnt = 0;
	var callbackEvents = [];
	var wrapEvents   = [];
	var multiEvents    = [];
	var device  = null;
	var devices = ["pointer","mouse","touch"];
	var types   = ["start","move","end","enter","leave"];
	var events  = {
		start  : "pointerdown mousedown touchstart",
		move   : "pointermove mousemove touchmove",
		end    : "pointerup mouseup touchend",
		enter  : "pointerenter mouseenter touchenter",
		leave  : "pointerleave mouseleave touchleave"
	};
	
	//multiイベントの種類に応じたpointer/mouse/touchイベントを追加する関数
	var AddMultiEvent = function(self,type,dele,callback){
		var MultiEvent = function(self,type,dele,eventsCnt){
			var match;
			var multiType = "multi" + type;
			var target = $(self);
			return function(eve){
				eve.multiType = multiType;
				
				match = devices.filter(function(ele){
					return ~eve.type.indexOf(ele);
				});
				if(device!==match[0]){
					if(((device==="touch")||(device==="pointer"))&&(match[0]==="mouse")){
						//mouse以外からmouseへの下方動作は認めない
						return;
					}
					if((device==="pointer")&&(match[0]==="touch")){
						//pointerからtouchへの下方動作は認めない
						return;
					}
					if(device!==null){
						//前回値が不明でなく、前回と今回が違う場合、
						//このマルチイベントはすでに呼ばれている。
						device = match[0];
						return;
					}
					device = match[0];
				}
				if(dele===null){
					return target.triggerHandler(multiType,[eve,eventsCnt]);
				}
				//delegateって結構闇なことしてるのね、って感じだ
				return target.find(eve.target).trigger(multiType,[eve,eventsCnt]);
			};
		};
		
		var multiEvent = MultiEvent(self,type,dele,eventsCnt);
		multiEvents[eventsCnt]    = multiEvent;
		callbackEvents[eventsCnt] = callback;
		if(dele===null){
			$(self).on(events[type],multiEvent);
		}
		else{
			$(self).on(events[type],dele,multiEvent);
		}
		return eventsCnt++;
	};
	
	//オーバーライドたのしい！！
	var _on = $.fn.on;
	$.fn.on = function(a,b,c,d,e){
		switch(a){
			case "multistart":
			case "multimove":
			case "multiend":
			case "multienter":
			case "multileave":
				if(typeof b==="undefined") break;
				var id,_dele,_callback,_wrap;
				var match = types.filter(function(ele){
					return ~a.indexOf(ele);
				});
				_wrap = function(hnd,eve,eventsCnt){
					if(_callback!==callbackEvents[eventsCnt]) return;
					eve.multiType = hnd.type;
					var ctouches = eve.originalEvent.changedTouches;
					eve.isMultiTouch = (!!ctouches) && (ctouches.length>1);
					return _callback.apply(this,[eve]);
				};
				if(typeof b==="function"){
					_dele = null;
					_callback = b;
					b = _wrap;
				}
				else if(typeof c==="function"){
					_dele = b;
					_callback = c;
					c = _wrap;
				}
				else{
					throw new Error("引数が不正だよっ");
				}
				id = AddMultiEvent(this,match[0],_dele,_callback);
				wrapEvents[id] = _wrap;
				break;
		}
		return _on.apply(this,[a,b,c,d,e]);
	};
	
	var _off = $.fn.off;
	$.fn.off = function(a,b,c){
		switch(a){
			case "multistart":
			case "multimove":
			case "multiend":
			case "multienter":
			case "multileave":
				var id,match,_multi,_wrap;
				if(typeof b==="function"){
					id = callbackEvents.indexOf(b);
					if(id<0) break;
					b = wrapEvents[id];
					_multi = multiEvents[id];
					match = types.filter(function(ele){
						return ~a.indexOf(ele);
					});
					$(this).off(events[match[0]],_multi);
				}
				else if(typeof c==="function"){
					id = callbackEvents.indexOf(c);
					if(id<0) break;
					c = wrapEvents[id];
					_multi = multiEvents[id];
					match = types.filter(function(ele){
						return ~a.indexOf(ele);
					});
					$(this).off(events[match[0]],_multi);
				}
				if(typeof _multi==="function"){
					delete callbackEvents[id];
					delete wrapEvents[id];
					delete multiEvents[id];
				}
				break;
		}
		return _off.apply(this,[a,b,c]);
	};
	
	//mouse,touch間の座標の差異を吸収するなんとか
	$.fn.getMultiXY = function(eve,opt){
		var output = {};
		if(!eve) return output;
		
		opt = opt || {};
		opt.target = isNaN(opt.target) ? 0 : Math.max(0,Math.min(opt.target-0,2));
		var cTarget = ["changedTouches","targetTouches","touches"][opt.target];
		
		switch(eve.type){
			case "mousedown":
			case "mousemove":
			case "mouseup":
			case "mouseenter":
			case "mouseleave":
			case "pointerdown":
			case "pointermove":
			case "pointerup":
			case "pointerenter":
			case "pointerleave":
				output.screenX = eve.screenX;
				output.screenY = eve.screenY;
				output.clientX = eve.clientX;
				output.clientY = eve.clientY;
				output.pageX   = eve.pageX;
				output.pageY   = eve.pageY;
				break;
			case "touchstart":
			case "touchmove":
			case "touchend":
			case "touchenter":
			case "touchleave":
			case "touchcancel":
				var cTouches = eve.originalEvent[cTarget];
				if(!cTouches || !cTouches.length) return output;
				output.screenX = cTouches[0].screenX;
				output.screenY = cTouches[0].screenY;
				output.clientX = cTouches[0].clientX;
				output.clientY = cTouches[0].clientY;
				output.pageX   = cTouches[0].pageX;
				output.pageY   = cTouches[0].pageY;
				break;
			default: //不明なイベント
				throw new Error("$.fn.getMultiXY : 謎のイベント" + eve.type + "を受けました。");
				break;
		}
		
		return output;
	};
})(jQuery);
