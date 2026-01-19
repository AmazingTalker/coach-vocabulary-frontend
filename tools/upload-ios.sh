#!/bin/bash
fastlane run upload_to_testflight api_key_path:../certs/ios-store/app_store_auth.json ipa:"$1"