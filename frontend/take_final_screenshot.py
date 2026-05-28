from selenium import webdriver
from selenium.webdriver.common.by import By
import time

options = webdriver.ChromeOptions()
options.add_argument('--start-maximized')
driver = webdriver.Chrome(options=options)

try:
    driver.get('http://localhost:3000/monitor')
    time.sleep(4)  # Wait for full page load
    driver.save_screenshot('monitor-final.png')
    print('✅ Screenshot saved: monitor-final.png')
finally:
    driver.quit()
