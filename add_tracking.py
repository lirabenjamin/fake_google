#!/usr/bin/env python3
import os
import glob
import re

def add_tracking_script(file_path):
    """Add tracking script to an HTML file if not already present"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Check if tracking script is already present
        if 'track-clicks.js' in content:
            return False
        
        # Find the closing </body> tag and add script before it
        tracking_script = '    <!-- Click tracking script -->\n    <script src="/public/track-clicks.js"></script>\n</body>'
        
        # Replace the closing </body> tag
        if '</body>' in content:
            content = content.replace('</body>', tracking_script)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        else:
            print(f"Warning: No </body> tag found in {file_path}")
            return False
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    # Get all HTML files in the project
    html_files = []
    
    # Root directory HTML files
    html_files.extend(glob.glob('*.html'))
    
    # Indeed directory HTML files
    html_files.extend(glob.glob('indeed/*.html'))
    
    updated_count = 0
    
    for file_path in html_files:
        if add_tracking_script(file_path):
            print(f"Added tracking to: {file_path}")
            updated_count += 1
        else:
            print(f"Skipped: {file_path}")
    
    print(f"\nTotal files updated: {updated_count}")
    print(f"Total files processed: {len(html_files)}")

if __name__ == "__main__":
    main()