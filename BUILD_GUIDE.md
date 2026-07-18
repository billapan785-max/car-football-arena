# Appflow Build Guide - Car Football Arena

This guide explains how to build the APK/AAB for your game using Ionic Appflow.

## 1. Configuration Details
- **Application Name**: Car Football Arena
- **Application ID (Package Name)**: `com.carfootballarena.app`
- **Framework**: Capacitor with React/Vite

## 2. Signing Certificate (Keystore)
I have generated a release keystore for you:
- **Filename**: `carfootballarena.p12`
- **Password**: `boostball123`
- **Alias**: `carfootballarena`
- **Key Password**: `boostball123`

## 3. Appflow Setup
1. **Import to GitHub**: Push this entire project to a new GitHub repository.
2. **Connect to Appflow**: Log in to Ionic Appflow and connect your GitHub repository.
3. **Build Settings**:
   - Choose **Android** as the platform.
   - Set the build type to **Release**.
   - Upload the `carfootballarena.p12` file when prompted for a signing certificate.
   - Use the password and alias mentioned above.

## 4. Local Build (Alternative)
If you have Android Studio installed locally, you can run:
```bash
npm run build
npx cap sync android
```
Then open the `android` folder in Android Studio to build the APK.

## 5. Troubleshooting (Common Errors)
### "Invalid or corrupt jarfile" in Appflow
This is the most common error. It happens because Git corrupted the `gradle-wrapper.jar` file by treating it as a text file during your first push.

**The "Nuclear" Fix (Recommended):**
If the previous fix didn't work, do this:
1.  In AI Studio, go to the **Settings** menu (top right).
2.  Click **Export as ZIP**.
3.  Extract the ZIP on your computer.
4.  Create a **BRAND NEW** GitHub repository.
5.  Push the extracted files to this new repository.
    *   *Note*: Because I added the `.gitattributes` file, this new push will treat the JAR file correctly as a binary from the start.

**The Manual Fix (If you want to keep the same repo):**
1.  Open your terminal/command prompt on your computer.
2.  Run these commands:
    ```bash
    # 1. Rename your local branch to 'main' (Fixes the "refspec main" error)
    git branch -M main
    
    # 2. Force Git to remove the corrupted file from tracking
    git rm --cached android/gradle/wrapper/gradle-wrapper.jar
    
    # 3. Add all files (the .gitattributes file I added will now protect the JAR)
    git add .
    
    # 4. Commit and push
    git commit -m "fix: restore binary gradle-wrapper.jar and rename branch"
    git push -u origin main
    ```
3.  In Appflow, **Rerun the build**.
