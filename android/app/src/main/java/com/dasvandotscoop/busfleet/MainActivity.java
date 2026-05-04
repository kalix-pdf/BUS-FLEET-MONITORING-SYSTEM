package com.dasvandotscoop.busfleet;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.getcapacitor.BridgeActivity;
import com.dasvandotscoop.busfleet.plugins.printer.BusPrinterPlugin;

public class MainActivity extends BridgeActivity {

    private SwipeRefreshLayout swipeRefresh;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.d("BusPrinter", "Registering BusPrinterPlugin");
        registerPlugin(BusPrinterPlugin.class);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        swipeRefresh = findViewById(R.id.swipe_refresh);
        ViewGroup container = findViewById(R.id.webview_container);

        final WebView webView = this.bridge.getWebView();

        ViewGroup parent = (ViewGroup) webView.getParent();
        ViewGroup.LayoutParams originalParams = webView.getLayoutParams();

        if (parent != null) {
            parent.removeView(webView);
        }

        if (originalParams != null) {
            container.addView(webView, originalParams);
        } else {
            container.addView(
                    webView,
                    new ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT));
        }

        swipeRefresh.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
            @Override
            public void onRefresh() {
                webView.reload();

                new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        swipeRefresh.setRefreshing(false);
                    }
                }, 1200);
            }
        });

        swipeRefresh.setOnChildScrollUpCallback(new SwipeRefreshLayout.OnChildScrollUpCallback() {
            @Override
            public boolean canChildScrollUp(SwipeRefreshLayout parentLayout, View child) {
                return webView.canScrollVertically(-1);
            }
        });
    }
}   