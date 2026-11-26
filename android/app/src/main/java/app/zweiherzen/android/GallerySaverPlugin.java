package app.zweiherzen.android;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

/**
 * "Save to gallery": puts a photo or video in the phone's gallery, in a "Zwei Herzen" album.
 * Android 10 and newer need no permission for this (the app can't see any other photos).
 * Android 9 and older ask once for storage access.
 */
@CapacitorPlugin(name = "ZhGallery", permissions = { @Permission(alias = "storage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }) })
public class GallerySaverPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        if (Build.VERSION.SDK_INT < 29 && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storageDone");
            return;
        }
        doSave(call);
    }

    @PermissionCallback
    private void storageDone(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) doSave(call);
        else call.reject("Storage permission was not given");
    }

    private void doSave(PluginCall call) {
        String data = call.getString("data");
        String mime = call.getString("mime", "image/jpeg");
        String name = call.getString("name", "ZweiHerzen.jpg").replaceAll("[^A-Za-z0-9._-]", "_");
        if (data == null) {
            call.reject("Nothing to save");
            return;
        }
        boolean video = mime.startsWith("video/");
        boolean audio = mime.startsWith("audio/");
        String folder = audio ? Environment.DIRECTORY_MUSIC : video ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES;
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            if (Build.VERSION.SDK_INT >= 29) {
                ContentResolver cr = getContext().getContentResolver();
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, folder + "/Zwei Herzen");
                v.put(MediaStore.MediaColumns.IS_PENDING, 1);
                Uri collection = audio
                    ? MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                    : video
                        ? MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                        : MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                Uri uri = cr.insert(collection, v);
                if (uri == null) throw new IOException("The gallery refused the file");
                try (OutputStream out = cr.openOutputStream(uri)) {
                    if (out == null) throw new IOException("Could not write the file");
                    out.write(bytes);
                }
                v.clear();
                v.put(MediaStore.MediaColumns.IS_PENDING, 0);
                cr.update(uri, v, null, null);
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(folder), "Zwei Herzen");
                if (!dir.exists() && !dir.mkdirs()) throw new IOException("Could not make the album");
                File f = new File(dir, name);
                try (FileOutputStream out = new FileOutputStream(f)) {
                    out.write(bytes);
                }
                MediaScannerConnection.scanFile(getContext(), new String[] { f.getAbsolutePath() }, new String[] { mime }, null);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not save to the gallery", e);
        }
    }
}
