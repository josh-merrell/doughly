package co.doughly.app;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  private String pendingSharedUrl = null;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    handleSharedIntent(getIntent());
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    handleSharedIntent(intent);
  }

  @Override
  public void onResume() {
    super.onResume();
    if (pendingSharedUrl != null && getBridge() != null) {
      getBridge().triggerJSEvent("urlShared", "window", "{ \"url\": \"" + pendingSharedUrl + "\" }");
      pendingSharedUrl = null;
    }
  }

  private void handleSharedIntent(Intent intent) {
    if (Intent.ACTION_SEND.equals(intent.getAction()) && intent.getType() != null) {
      if ("text/plain".equals(intent.getType())) {
        String sharedUrl = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (sharedUrl != null) {
          if (getBridge() != null) {
            getBridge().triggerJSEvent("urlShared", "window", "{ \"url\": \"" + sharedUrl + "\" }");
          } else {
            pendingSharedUrl = sharedUrl;
          }
        }
      }
    }
  }
}
