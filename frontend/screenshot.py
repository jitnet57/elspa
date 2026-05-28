from selenium import webdriver
import time

options = webdriver.ChromeOptions()
options.add_argument('--start-maximized')
driver = webdriver.Chrome(options=options)

try:
    driver.get('http://localhost:3000/monitor')
    time.sleep(5)
    driver.save_screenshot('monitor-massage-final.png')
    print('Screenshot captured successfully')
finally:
    driver.quit()
