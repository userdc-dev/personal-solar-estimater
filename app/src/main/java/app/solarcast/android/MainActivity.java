package app.solarcast.android;
import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.content.Intent;
import android.net.Uri;
import android.webkit.*;
import android.view.View;
import androidx.webkit.WebViewAssetLoader;
public class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  web=new WebView(this); web.setBackgroundColor(Color.rgb(16,24,32)); setContentView(web);
  web.setOnApplyWindowInsetsListener((v,insets)-> { v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom()); return insets.consumeSystemWindowInsets(); });
  web.getSettings().setJavaScriptEnabled(true); web.getSettings().setDomStorageEnabled(true);
  web.getSettings().setAllowFileAccess(false); web.getSettings().setAllowContentAccess(false);
  web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest req){return loader.shouldInterceptRequest(req.getUrl());}
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest req){
    Uri uri=req.getUrl(); if ("appassets.androidplatform.net".equals(uri.getHost())) return false;
    if("https".equals(uri.getScheme())) { try {startActivity(new Intent(Intent.ACTION_VIEW,uri));} catch(Exception ignored) {} } return true;
   }
  });
  web.loadUrl("https://appassets.androidplatform.net/assets/index.html");
 }
 @Override protected void onDestroy(){web.destroy();super.onDestroy();}
}
