import sys
from PIL import Image

def process_image(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # Assuming the generated blue is strong blue (B > 100, R < 100, G < 100)
        # We make it transparent
        if item[2] > 100 and item[0] < 100 and item[1] < 100:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print("Done")

if __name__ == "__main__":
    input_file = "/mnt/c/Users/fx507/.gemini/antigravity-ide/brain/7260fb66-77d9-42e0-b9dc-acaaf39f10aa/puzzle_stone_frame_1782110930204.png"
    output_file = "/home/me/nusavira/public/credit/frame_puzzle.png"
    process_image(input_file, output_file)
