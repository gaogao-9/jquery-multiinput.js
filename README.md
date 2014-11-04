jquery-multiinput.js
====================

mouse/touchイベント間の闇を吸収して、いずれかのイベントが発動した時に発動してくれるmultiイベントを定義できるjQuery向けライブラリです

### サンプル
```js
$(document).on("multistart",function(eve){
	console.log(eve.type);      // 押したデバイスに依存[mousedown/touchstart/pointerdown]いずれか
	console.log(eve.multiType); // "multistart"と表示
	
	var pos = $.fn.getMultiXY(eve); // この関数もこのライブラリに入ってます。
	console.log("page  (" + pos.pageX   + "," + pos.pageY   + ")"); // "page(x,y)"と表示
	console.log("client(" + pos.clientX + "," + pos.clientY + ")"); // "client(x,y)"と表示
	console.log("screen(" + pos.screenX + "," + pos.screenY + ")"); // "screen(x,y)"と表示
	//↑の3つはデバイスに依存せず常に返します。touchの場合は、changedTouches[0]を元に返します。
	
	//依存先を変えたい場合は$.fn.getMultiXY(eve,{target:num});で、numを指定すると変えられます。
	//numが無指定もしくは0のときはchangedTouched依存
	//numが1のときはtargetTouches依存
	//numが2のときはtouches依存となっています。
});
```

### ライセンス
Public Domainです。ご自由にどうぞ。
